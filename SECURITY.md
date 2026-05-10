# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please email the maintainer instead of using the issue tracker. This allows us to address the issue before it becomes public knowledge.

### Contact

- Email: [security contact will be added]
- Please do not publicly disclose the vulnerability until we have had a chance to address it.

## Supported Versions

This project is in active development. We recommend always using the latest version to ensure you have the most up-to-date security fixes.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

## Security Best Practices

When using this project, please follow these security practices:

### 1. API Keys

- ✅ Keep your `.env` file secret
- ✅ Never commit `.env` to version control
- ✅ Rotate API keys regularly
- ✅ Use environment variables for all secrets
- ❌ Don't share API keys via chat or email

### 2. Database

- ✅ Back up your database regularly
- ✅ Keep your SQLite database secure
- ❌ Don't expose database files publicly

### 3. Telegram Bot

- ✅ Only share your bot username, not the token
- ✅ Use a strong username
- ❌ Don't expose your Telegram Bot Token

### 4. Updates

- ✅ Keep your dependencies up to date
- ✅ Run `npm audit` regularly to check for vulnerabilities
- ✅ Review dependency updates before installing

```bash
# Check for vulnerabilities
npm audit

# Automatically fix common vulnerabilities
npm audit fix

# Update dependencies safely
npm update
```

### 5. Deployment

- ✅ Use environment variables for all configuration
- ✅ Enable HTTPS if hosting on a server
- ✅ Use a firewall to restrict access
- ✅ Keep your system updated with security patches
- ❌ Don't run the bot with root/admin privileges

## Vulnerability Disclosure

If a vulnerability is reported:

1. We will acknowledge receipt within 48 hours
2. We will investigate and confirm the vulnerability
3. We will develop a fix and release a security update
4. We will credit the reporter (unless they wish to remain anonymous)

## Security Headers & Best Practices

When hosting this bot:

1. **Environment Isolation:**
   - Run in a containerized environment (Docker)
   - Limit resource access
   - Restrict network access

2. **Logging:**
   - Never log sensitive information (API keys, tokens)
   - Rotate logs regularly
   - Review logs for suspicious activity

3. **Monitoring:**
   - Monitor bot activity for unusual behavior
   - Set up alerts for errors
   - Review memory storage regularly

## Responsible Disclosure

Please report security issues responsibly:

1. ✅ Contact maintainers privately first
2. ✅ Give us reasonable time to fix (30 days)
3. ✅ Avoid public disclosure until patched
4. ✅ Respect the privacy of other users

Thank you for helping keep this project secure!
