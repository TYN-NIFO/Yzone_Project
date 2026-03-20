import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const toEmail = process.env.SENDGRID_FROM_EMAIL!; // send test to yourself

(async () => {
  console.log('📧 Testing SendGrid...');
  console.log('   From:', process.env.SENDGRID_FROM_EMAIL);
  console.log('   To  :', toEmail);
  console.log('   Key :', process.env.SENDGRID_API_KEY?.slice(0, 12) + '...');

  try {
    await sgMail.send({
      to: toEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME || 'YZone',
      },
      subject: '✅ YZone - SendGrid Test Email',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#2563eb;">SendGrid is working! 🎉</h2>
          <p>Your forgot password emails will be sent from this address.</p>
          <p style="color:#64748b;font-size:13px;">YZone Platform</p>
        </div>
      `,
      text: 'SendGrid is working! Your forgot password emails will be sent from this address.',
    });

    console.log('\n✅ Email sent successfully! Check your inbox at:', toEmail);
  } catch (err: any) {
    console.error('\n❌ Failed:', err.message);
    if (err.response?.body?.errors) {
      err.response.body.errors.forEach((e: any) => console.error('  -', e.message));
    }
  }
})();
