# OpenRouter Setup Guide for Cline

This guide will help you configure Cline to use OpenRouter's free AI models.

## Step 1: Get Your OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to your [API Keys page](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the API key

## Step 2: Set Environment Variable

Set your OpenRouter API key as an environment variable:

### Linux/macOS
```bash
export OPENROUTER_API_KEY="your-api-key-here"
```

To make it permanent, add it to your shell profile:
```bash
echo 'export OPENROUTER_API_KEY="your-api-key-here"' >> ~/.bashrc
# or ~/.zshrc if using zsh
source ~/.bashrc
```

### Windows (Command Prompt)
```cmd
setx OPENROUTER_API_KEY "your-api-key-here"
```

### Windows (PowerShell)
```powershell
$env:OPENROUTER_API_KEY = "your-api-key-here"
```

## Step 3: Configure Privacy Settings

Based on the privacy page you shared, here are the recommended settings for free model usage:

### Recommended Privacy Settings:
- ✅ **Enable free endpoints that may train on inputs** - Allows access to free models
- ✅ **Enable free endpoints that may publish prompts** - Required for some free models
- ✅ **Enable 1% discount on all LLMs** - Helps support the service
- ❌ **ZDR Endpoints Only** - Disable to access free models

## Step 4: Available Free Models

The configuration includes these free models in priority order:

1. **Primary**: `meta-llama/llama-3-8b-instruct:free` - General purpose, good for coding
2. **Fallback**: `qwen/qwen-2-5-coder-32b-instruct:free` - Code-specific model
3. **Secondary**: `google/gemini-2.5-flash-lite:free` - Fast, lightweight model

## Step 5: Test Your Configuration

Restart Cline and test that it's working:

```bash
# Restart Cline if it's running
cline restart

# Or start it fresh
cline start
```

## Troubleshooting

### API Key Issues
- Ensure the environment variable is set correctly
- Check that you haven't exceeded your free tier limits
- Verify your API key hasn't been revoked

### Model Availability
- Some free models may have usage limits
- The configuration will automatically fall back to other models if one is unavailable
- Check the OpenRouter status page for any service issues

### Privacy Concerns
If you're concerned about data privacy:
- You can disable "Enable free endpoints that may train on inputs"
- This will limit you to paid models only
- Consider using local models via Ollama as configured in the "local" section

## Usage Tips

1. **Monitor Usage**: Keep track of your OpenRouter usage dashboard
2. **Model Selection**: The configuration automatically selects the best available model
3. **Performance**: Free models may have rate limits and slower response times
4. **Fallback Strategy**: If one model is unavailable, Cline will automatically try the next one

## Environment Variables Reference

```bash
# Required for OpenRouter
export OPENROUTER_API_KEY="your-api-key-here"

# Optional: Override model selection
export CLINE_MODEL="custom-model-name"

# Optional: Adjust temperature (creativity)
export CLINE_TEMPERATURE="0.7"
```

## Next Steps

Once configured, Cline will automatically use OpenRouter's free models for all AI operations, including:
- Code generation and completion
- Code review and analysis
- Documentation generation
- Debugging assistance
- And all other AI-powered features

The configuration prioritizes free models while maintaining high-quality responses through intelligent fallback mechanisms.