export const OTP_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - OTP Code</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #050505;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #141414;
            border-radius: 8px;
            border: 1px solid #30333A;
            padding: 40px;
        }
        .otp-code {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #FDD458;
            text-align: center;
            padding: 20px;
            background-color: #212328;
            border-radius: 8px;
            margin: 30px 0;
            font-family: monospace;
        }
        .text-primary {
            color: #FDD458;
        }
        .text-secondary {
            color: #CCDADC;
        }
        .text-muted {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <h1 style="color: #FDD458; margin: 0 0 20px 0;">Verify Your Email</h1>
        <p class="text-secondary" style="margin: 0 0 20px 0;">
            Hi {{name}},
        </p>
        <p class="text-secondary" style="margin: 0 0 20px 0;">
            Thank you for signing up! Please use the following OTP code to verify your email address:
        </p>
        <div class="otp-code">
            {{otpCode}}
        </div>
        <p class="text-secondary" style="margin: 20px 0;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
        </p>
        <p class="text-muted" style="margin: 30px 0 0 0; font-size: 14px;">
            © ${new Date().getFullYear()} Stock tracker. All rights reserved.
        </p>
    </div>
</body>
</html>`;

