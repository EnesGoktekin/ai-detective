# Step 1.4 Gemini AI Test

Bu dosya Gemini AI entegrasyonunu test etmek için kullanılır.

## Test 1: Bağlantı Testi
GET http://localhost:3000/api/ai/test

Beklenen sonuç:
```json
{
  "status": "connected",
  "message": "Gemini AI connection successful! 🤖",
  "timestamp": "..."
}
```

## Test 2: Basit Prompt Testi
POST http://localhost:3000/api/ai/prompt
Content-Type: application/json

```json
{
  "prompt": "What is the capital of Turkey?"
}
```

## Test 3: Dedektif Prompt Testi
POST http://localhost:3000/api/ai/prompt
Content-Type: application/json

```json
{
  "prompt": "You are a detective investigating a mysterious case. A valuable painting was stolen from a museum. What would be your first steps?"
}
```

## PowerShell Test Commands

### Test 1: Bağlantı
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/test" -Method GET
```

### Test 2: Basit Prompt
```powershell
$body = @{
    prompt = "What is the capital of Turkey?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/ai/prompt" -Method POST -Body $body -ContentType "application/json"
```

### Test 3: Dedektif Prompt
```powershell
$body = @{
    prompt = "You are a detective investigating a mysterious case. A valuable painting was stolen from a museum. What would be your first steps?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/ai/prompt" -Method POST -Body $body -ContentType "application/json"
```
