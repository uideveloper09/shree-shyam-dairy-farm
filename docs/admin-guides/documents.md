# Document Management System

Enterprise DMS: upload, folders, categorized documents, PDF preview, OCR, version history, digital signatures, and cloud storage (local / S3 / R2).

## Modules

| Module                | Implementation                                             |
| --------------------- | ---------------------------------------------------------- |
| Upload                | `POST /api/v1/documents/upload` (multipart)                |
| Folders               | `DocumentFolder` tree + default seed folders               |
| Documents             | `Document` model with metadata & tags                      |
| Invoices              | Category `INVOICE` → `/invoices` folder                    |
| Certificates          | Category `CERTIFICATE`                                     |
| Vaccination Documents | Category `VACCINATION`                                     |
| Purchase Bills        | Category `PURCHASE_BILL`                                   |
| Employee Documents    | Category `EMPLOYEE`                                        |
| Contracts             | Category `CONTRACT`                                        |
| PDF Preview           | `GET /api/v1/documents/[id]/download?inline=true` + iframe |
| OCR                   | OpenAI vision (`lib/documents/ocr.ts`)                     |
| Version History       | `DocumentVersion` per upload revision                      |
| Digital Signature     | SHA-256 hash + signer record                               |
| Cloud Storage         | `lib/ops/storage.ts` — local, S3, R2                       |

## Architecture

```
Upload → Cloud storage (S3/R2/local)
       → Document + Version v1
       → Folder by category
       → Optional OCR / Signature
```

## Admin

`/admin/documents` — browse, folders, upload, PDF preview, OCR, versions, signatures.

## API

| Endpoint                                | Description               |
| --------------------------------------- | ------------------------- |
| `GET /api/v1/documents`                 | List documents            |
| `POST /api/v1/documents/upload`         | Upload file               |
| `GET/POST /api/v1/documents/folders`    | Folder tree               |
| `GET /api/v1/documents/[id]`            | Document detail           |
| `GET /api/v1/documents/[id]/download`   | Download / inline preview |
| `GET /api/v1/documents/[id]/versions`   | Version history           |
| `POST /api/v1/documents/[id]/ocr`       | Run OCR                   |
| `GET/POST /api/v1/documents/[id]/sign`  | Signatures                |
| `GET /api/v1/documents/admin/dashboard` | Stats + folders           |

## Upload example

```bash
curl -X POST /api/v1/documents/upload \
  -H "Cookie: ssd_access=..." \
  -F "file=@invoice.pdf" \
  -F "title=March Milk Invoice" \
  -F "category=INVOICE"
```

## Digital signature

```json
POST /api/v1/documents/{id}/sign
{
  "signatureData": "base64-signature-image-or-token",
  "signerName": "Ravi Kumar"
}
```

## Cloud storage env

```env
STORAGE_PROVIDER=local|s3|r2
STORAGE_BUCKET=
R2_BUCKET_NAME=
OPENAI_API_KEY=   # for OCR
```

## Seed

```bash
npm run db:seed-documents
```

## Related

- [Deployment](../architecture/deployment.md) — storage configuration
- [Workflows](./workflows.md) — attach documents to approval requests
