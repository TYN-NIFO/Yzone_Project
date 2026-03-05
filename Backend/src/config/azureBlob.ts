import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

let blobServiceClient: BlobServiceClient | null = null;

if (process.env.AZURE_STORAGE_CONNECTION_STRING &&
    !process.env.AZURE_STORAGE_CONNECTION_STRING.includes("YOUR_ACCOUNT")) {
    blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
    );
}

export const uploadToAzureBlob = async (
    buffer: Buffer,
    originalName: string,
    mimeType: string
): Promise<{ url: string; blobName: string; containerName: string }> => {
    if (!blobServiceClient) {
        // Return a mock URL in dev when Azure is not configured
        const mockName = `mock_${uuidv4()}_${originalName}`;
        return {
            url: `https://mock-azure-storage.blob.core.windows.net/${mockName}`,
            blobName: mockName,
            containerName: process.env.AZURE_CONTAINER_NAME || "yzone-tracker-files",
        };
    }

    const containerName = process.env.AZURE_CONTAINER_NAME || "yzone-tracker-files";
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: "private" });

    const ext = originalName.split(".").pop();
    const blobName = `${uuidv4()}.${ext}`;
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: mimeType },
    });

    const url = blockBlobClient.url;
    return { url, blobName, containerName };
};

export { blobServiceClient };
