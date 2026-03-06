# 🤖 DeepSeek AI Integration Guide

## Overview

ChronosAI now uses **DeepSeek Chat** as the AI provider. DeepSeek is OpenAI-compatible, so we use the `openai` Python library with a custom base URL.

## Why DeepSeek?

- ✅ **Cost-effective**: More affordable than GPT-4
- ✅ **High performance**: Excellent reasoning capabilities
- ✅ **OpenAI-compatible**: Drop-in replacement using the same SDK
- ✅ **Fast responses**: Low latency for real-time chat

## Setup Instructions

### 1. Get DeepSeek API Key

1. Visit: https://platform.deepseek.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Update Environment Variables

**Backend `.env` file:**
```bash
# DeepSeek AI
OPENAI_API_KEY=sk-your-deepseek-api-key-here
OPENAI_MODEL=deepseek-chat
OPENAI_BASE_URL=https://api.deepseek.com
```

### 3. Verify Configuration

The application will automatically use DeepSeek with these settings. No code changes needed!

## Available Models

DeepSeek offers several models:

| Model | Description | Use Case |
|-------|-------------|----------|
| `deepseek-chat` | Latest chat model | **Recommended** for ChronosAI |
| `deepseek-coder` | Code-focused model | For code generation tasks |

**Current Configuration**: `deepseek-chat` (best for conversational AI)

## API Compatibility

DeepSeek uses OpenAI-compatible API, so our existing code works without changes:

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key="sk-your-deepseek-key",
    base_url="https://api.deepseek.com"
)

# Same API as OpenAI!
response = await client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Hello"}]
)
```

## Testing

### Test Locally

```bash
cd backend

# Set environment variables
export OPENAI_API_KEY=sk-your-deepseek-key
export OPENAI_MODEL=deepseek-chat
export OPENAI_BASE_URL=https://api.deepseek.com

# Run tests
PYTHONPATH=. pytest -v
```

### Test API Endpoint

```bash
# Start the backend
uvicorn app.main:app --reload

# Test chat endpoint
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Schedule a meeting tomorrow at 2pm"}'
```

## Pricing

DeepSeek is significantly more affordable than GPT-4:

| Provider | Input (per 1M tokens) | Output (per 1M tokens) |
|----------|----------------------|------------------------|
| DeepSeek | $0.14 | $0.28 |
| GPT-4o | $2.50 | $10.00 |

**Savings**: ~95% cost reduction! 💰

## Rate Limits

DeepSeek has generous rate limits:
- **Free tier**: 10 requests/minute
- **Paid tier**: 100+ requests/minute

For production, consider upgrading to paid tier.

## Migration Checklist

- [x] Update `app/config.py` - Default model and base URL
- [x] Update `.env.example` - Documentation
- [x] Update `README.md` - User-facing docs
- [x] Update CI/CD workflow - Test environment
- [x] Create migration guide - This document

## Troubleshooting

### Error: "Invalid API key"

**Solution**: Verify your DeepSeek API key:
```bash
# Check if key is set
echo $OPENAI_API_KEY

# Should start with "sk-"
```

### Error: "Model not found"

**Solution**: Ensure you're using `deepseek-chat`:
```bash
export OPENAI_MODEL=deepseek-chat
```

### Error: "Connection timeout"

**Solution**: Check base URL:
```bash
export OPENAI_BASE_URL=https://api.deepseek.com
```

### Slow responses

**Possible causes**:
1. Network latency
2. Rate limiting
3. Large context window

**Solutions**:
- Reduce context messages (currently limited to last 4)
- Upgrade to paid tier
- Add caching for common queries

## Performance Optimization

### 1. Reduce Token Usage

```python
# Limit context to last 4 messages (already implemented)
for item in context[-4:]:
    messages.append({"role": item["role"], "content": item["content"]})
```

### 2. Use Lower Temperature

```python
# For more deterministic responses
response = await client.chat.completions.create(
    model="deepseek-chat",
    temperature=0.1,  # Lower = more consistent
    max_tokens=1000
)
```

### 3. Cache Common Responses

Consider caching responses for:
- Availability queries
- Meeting confirmations
- Error messages

## Monitoring

### Track API Usage

DeepSeek dashboard shows:
- Total requests
- Token usage
- Cost breakdown
- Error rates

Visit: https://platform.deepseek.com/usage

### Application Logs

Monitor logs for AI-related issues:
```bash
# View backend logs
docker-compose logs -f backend | grep "llm_service"
```

## Rollback Plan

If you need to switch back to OpenAI:

```bash
# Update .env
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o
OPENAI_BASE_URL=https://api.openai.com/v1

# Restart services
docker-compose restart backend
```

## Support

### DeepSeek Resources
- **Documentation**: https://platform.deepseek.com/docs
- **API Reference**: https://platform.deepseek.com/api-docs
- **Discord**: https://discord.gg/deepseek

### ChronosAI Support
- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check README.md and other guides

## Next Steps

1. ✅ Get DeepSeek API key
2. ✅ Update `.env` file
3. ✅ Test locally
4. ✅ Deploy to production
5. ✅ Monitor usage and costs

---

**Status**: ✅ DeepSeek Integration Complete  
**Date**: 2026-03-06  
**Version**: v1.0.0-mvp
