---
title: Custom CA Certificates
description: Configure custom SSL/TLS certificates for accessing private registries with self-signed certificates or internal certificate authorities.
---

If your private registries or package feeds use self-signed certificates or internal certificate authorities, you need to provide custom CA certificates to Paklo. This is common when using:

- Internal JFrog Artifactory or Nexus repositories
- Corporate proxy servers with SSL inspection
- Azure DevOps Artifacts with custom certificates
- Self-signed certificates in development environments

:::warning
Custom CA certificates are **not supported** in the [hosted service](/docs/hosted). Use the [Azure DevOps extension](/docs/extensions/azure) or [CLI](/docs/cli) if you need this feature.
:::

## Environment Variables

Paklo supports two environment variables for custom CA certificates:

### CUSTOM_CA_PATH

Set this to the path of your custom CA certificate file:

```bash
export CUSTOM_CA_PATH=/path/to/your/certificate.crt
```

### NODE_EXTRA_CA_CERTS

Alternatively, use Node.js's standard environment variable:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/your/certificate.crt
```

## Certificate Format

The certificate file must be in **PEM format**. This is a text-based format that looks like:

```txt
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKe...
...
-----END CERTIFICATE-----
```

If you have a certificate in another format (like `.der` or `.pfx`), you'll need to convert it to PEM first.

## Usage with CLI

When using the Paklo CLI, set the environment variable before running commands:

```bash
# Set the custom CA certificate path
export CUSTOM_CA_PATH=/etc/ssl/certs/company-ca.crt

# Run Paklo CLI
paklo run \
  --provider azure
  --repository-url https://dev.azure.com/my-org/my-project/_git/my-repo \
  --git-token $GIT_ACCESS_TOKEN \
  --debug
```

### Example: JFrog Artifactory

If you're using an internal JFrog Artifactory server:

```bash
# Export your company's root CA certificate
export CUSTOM_CA_PATH=/etc/ssl/certs/company-root-ca.crt

# Configure your dependabot.yml with the Artifactory registry
# (see Private Registries documentation)

# Run Paklo
paklo run \
  --provider azure
  --repository-url https://dev.azure.com/my-org/my-project/_git/my-repo \
  --git-token $GIT_ACCESS_TOKEN
```

### Example: Corporate Proxy with SSL Inspection

If your network uses a proxy that intercepts SSL traffic:

```bash
# Export the proxy's CA certificate
export NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/proxy-ca.crt

# Also set proxy environment variables if needed
export https_proxy=http://proxy.company.com:8080
export http_proxy=http://proxy.company.com:8080

paklo run --provider azure --repository-url https://dev.azure.com/my-org/my-project/_git/my-repo ...
```

## Usage with Azure DevOps Extension

When using the Azure DevOps extension in pipelines, you can set the environment variable in your pipeline YAML:

```yaml
steps:
  - task: dependabot@2
    inputs:
      mergeStrategy: 'squash'
    env:
      CUSTOM_CA_PATH: /path/to/certificate.crt
```

Or mount the certificate file and set the path:

```yaml
steps:
  - script: |
      echo "$COMPANY_CA_CERT" > /tmp/company-ca.crt
    displayName: 'Create CA certificate file'
    env:
      COMPANY_CA_CERT: $(CompanyCACertificate)
  
  - task: dependabot@2
    inputs:
      mergeStrategy: 'squash'
    env:
      CUSTOM_CA_PATH: /tmp/company-ca.crt
```

## Troubleshooting

### Certificate Not Working

If you're still getting TLS errors after setting the certificate:

1. **Verify the certificate path** - Ensure the file exists and is readable:

   ```bash
   ls -la $CUSTOM_CA_PATH
   cat $CUSTOM_CA_PATH  # Should show the PEM-formatted certificate
   ```

2. **Check certificate format** - The certificate must be PEM format. Convert if needed:

   ```bash
   # Convert DER to PEM
   openssl x509 -inform der -in certificate.der -out certificate.pem
   ```

3. **Use full certificate chain** - You may need the complete certificate chain, not just the root CA:

   ```bash
   # Combine multiple certificates into one file
   cat root-ca.crt intermediate-ca.crt > full-chain.crt
   export CUSTOM_CA_PATH=/path/to/full-chain.crt
   ```

4. **Enable debug logging** - Run with `--debug` flag to see detailed error messages:

   ```bash
   paklo run --debug -v trace ...
   ```

### Error: "Cannot read TLS response"

This error typically indicates:

- The certificate path is incorrect or the file doesn't exist
- The certificate doesn't match the server you're connecting to
- You need the full certificate chain, not just the root CA

### Testing the Certificate

Test your certificate configuration before running Paklo:

```bash
# Test with curl
curl --cacert $CUSTOM_CA_PATH https://your-registry.company.com

# Test with openssl
openssl s_client -connect your-registry.company.com:443 -CAfile $CUSTOM_CA_PATH
```

## Getting Your Certificate

### From macOS Keychain

```bash
# Export from Keychain Access
security find-certificate -a -p > company-certificates.pem
```

### From Windows Certificate Store

```powershell
# Export using PowerShell
$cert = Get-ChildItem -Path Cert:\CurrentUser\Root | Where-Object {$_.Subject -like "*YourCompany*"}
$bytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes("company-ca.crt", $bytes)
```

### From Linux

On many Linux systems, CA certificates are stored in:

- `/etc/ssl/certs/`
- `/usr/local/share/ca-certificates/`

### From Your Browser

1. Visit the site in your browser (e.g., `https://artifactory.company.com`)
2. Click the padlock icon in the address bar
3. Click "Certificate" or "View Certificate"
4. Export the certificate in PEM format

## Related Documentation

- [Private Registries](/docs/private-registries) - Configure private package registries
- [CLI Reference](/docs/cli) - Complete CLI documentation
- [Troubleshooting](/docs/troubleshooting) - Common issues and solutions
