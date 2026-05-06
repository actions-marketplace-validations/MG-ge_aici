export const AICI_CONFIG_SCHEMA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:aici:schema:config:v1",
  "title": "Aici config",
  "type": "object",
  "required": ["version", "tests"],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "type": "string"
    },
    "version": {
      "const": 1
    },
    "provider": {
      "$ref": "#/$defs/provider"
    },
    "redact": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "tests": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/test"
      }
    }
  },
  "$defs": {
    "provider": {
      "type": "object",
      "required": ["type", "model"],
      "additionalProperties": false,
      "allOf": [
        {
          "if": {
            "properties": {
              "type": {
                "const": "openai-compatible"
              }
            },
            "required": ["type"]
          },
          "then": {
            "required": ["baseUrl"]
          }
        },
        {
          "if": {
            "properties": {
              "type": {
                "const": "openai"
              }
            },
            "required": ["type"]
          },
          "then": {
            "not": {
              "required": ["baseUrl"]
            }
          }
        },
        {
          "if": {
            "properties": {
              "type": {
                "const": "anthropic"
              }
            },
            "required": ["type"]
          },
          "then": {
            "not": {
              "required": ["baseUrl"]
            }
          }
        }
      ],
      "properties": {
        "type": {
          "enum": ["openai", "openai-compatible", "anthropic"]
        },
        "model": {
          "type": "string",
          "minLength": 1
        },
        "api": {
          "enum": ["responses", "chat-completions", "messages"]
        },
        "apiKeyEnv": {
          "type": "string"
        },
        "baseUrl": {
          "type": "string"
        },
        "apiVersion": {
          "type": "string"
        },
        "timeoutMs": {
          "type": "number",
          "minimum": 1
        },
        "retries": {
          "type": "number",
          "minimum": 0
        },
        "temperature": {
          "type": "number"
        },
        "maxOutputTokens": {
          "type": "number",
          "minimum": 1
        }
      }
    },
    "test": {
      "type": "object",
      "required": ["name"],
      "additionalProperties": false,
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1
        },
        "provider": {
          "$ref": "#/$defs/provider"
        },
        "prompt": {
          "type": "string"
        },
        "promptFile": {
          "type": "string"
        },
        "input": {
          "type": "string"
        },
        "inputFile": {
          "type": "string"
        },
        "tools": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/tool"
          }
        },
        "toolChoice": {
          "$ref": "#/$defs/toolChoice"
        },
        "mockOutput": {
          "type": "string"
        },
        "mockOutputFile": {
          "type": "string"
        },
        "mockToolCalls": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/toolCall"
          }
        },
        "mockToolCallsFile": {
          "type": "string"
        },
        "expect": {
          "$ref": "#/$defs/expect"
        }
      }
    },
    "tool": {
      "type": "object",
      "required": ["name"],
      "additionalProperties": false,
      "properties": {
        "name": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{1,64}$"
        },
        "description": {
          "type": "string"
        },
        "parameters": {
          "type": "object"
        },
        "parametersFile": {
          "type": "string"
        },
        "strict": {
          "type": "boolean"
        }
      }
    },
    "toolChoice": {
      "oneOf": [
        {
          "enum": ["auto", "none", "required"]
        },
        {
          "type": "object",
          "required": ["name"],
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string",
              "pattern": "^[A-Za-z0-9_-]{1,64}$"
            }
          }
        }
      ]
    },
    "toolCall": {
      "type": "object",
      "required": ["name"],
      "additionalProperties": true,
      "properties": {
        "name": {
          "type": "string"
        },
        "arguments": true,
        "raw": true
      }
    },
    "expect": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "exact": {
          "type": "string"
        },
        "contains": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "regex": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "json": {
          "type": "boolean"
        },
        "jsonSchema": {
          "type": "string"
        },
        "toolCalls": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/toolCallExpectation"
          }
        },
        "maxLatencyMs": {
          "type": "number",
          "minimum": 0
        },
        "maxCostUsd": {
          "type": "number",
          "minimum": 0
        }
      }
    },
    "toolCallExpectation": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "name": {
          "type": "string"
        },
        "index": {
          "type": "integer",
          "minimum": 0
        },
        "argumentsContains": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "argumentsJsonSchema": {
          "type": "string"
        }
      }
    }
  }
} as const;
