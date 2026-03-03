import { BlobServiceClient } from "@azure/storage-blob";
import { pool } from "../config/db";

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient | null;
  private containerName: string;
  private isEnabled: boolean;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
    this.containerName = process.env.AZURE_STORAGE_CONTAINER || "yzone-files";
    this.isEnabled = !!connectionString && connectionString.length > 10;
    
    if (this.isEnabled) {
      try {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      } catch (error) {
        console.warn("⚠️  Azure Storage not configured properly. File uploads will be disabled.");
        this.isEnabled = false;
        this.blobServiceClient = null;
      }
    } else {
      console.warn("⚠️  Azure Storage connection string not found. File uploads will be disabled.");
      this.blobServiceClient = null;
    }
  }

  async uploadFile(file: Express.Multer.File, userId: string, tenantId: string, trackerEntryId?: string) {
    if (!this.isEnabled || !this.blobServiceClient) {
      console.warn("Azure Storage not configured. Skipping file upload.");
      return null;
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      await containerClient.createIfNotExists({ access: "blob" });

      const blobName = `${Date.now()}-${file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const blobUrl = blockBlobClient.url;

      const result = await pool.query(
        `INSERT INTO azure_blob_files (user_id, tenant_id, tracker_entry_id, file_name, file_type, file_size, blob_url, container_name, blob_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          userId,
          tenantId,
          trackerEntryId || null,
          file.originalname,
          file.mimetype,
          file.size,
          blobUrl,
          this.containerName,
          blobName,
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Failed to upload file:", error);
      return null;
    }
  }

  async deleteFile(blobName: string) {
    if (!this.isEnabled || !this.blobServiceClient) {
      console.warn("Azure Storage not configured. Skipping file deletion.");
      return;
    }

    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  }

  async getFileUrl(blobName: string): Promise<string> {
    if (!this.isEnabled || !this.blobServiceClient) {
      return "";
    }

    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }
}
