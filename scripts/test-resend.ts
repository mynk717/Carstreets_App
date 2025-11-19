import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  const result = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: 'YOUR_ACTUAL_EMAIL@gmail.com', // Use your real email
    subject: 'MotoYard Test Email',
    html: '<p>If you receive this, Resend is working!</p>'
  })
  
  console.log("Result:", result)
}

testEmail()
