import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

interface YamlConfig {
  node?: {
    name?: string;
    port?: number;
    dataDir?: string;
    logLevel?: string;
  };
  blockchain?: {
    network?: string;
    arbitrumRpcUrl?: string;
    registryContractAddress?: string;
  };
  registry?: {
    serviceEndpoint?: string;
    refreshInterval?: number;
  };
  security?: {
    encryptionType?: string;
    keyRotationPeriod?: number;
    tlsEnabled?: boolean;
    tlsCert?: string;
    tlsKey?: string;
  };
  storage?: {
    type?: string;
    mongodb?: {
      uri?: string;
      database?: string;
    };
  };
  agents?: {
    defaultCapabilities?: string[];
    autoDiscovery?: boolean;
    handshakeTimeout?: number;
    maxConcurrentRequests?: number;
  };
  communication?: {
    protocol?: string;
    messageFormat?: string;
    maxMessageSizeBytes?: number;
    compression?: boolean;
  };
  loop_detection?: {
    maxTTL?: number;
    maxHops?: number;
    stateCheckpointFrequency?: number;
  };
  credentials?: {
    defaultExpiryDays?: number;
    vcSchemas?: {
      AgentCredential?: string;
      CapabilityCredential?: string;
    };
  };
}

// Load configuration from multiple potential sources
// Priority: environment variables > yaml config > default values
export default () => {
  let yamlConfig: YamlConfig = {};

  // Try to load YAML config file if exists
  try {
    const configPath =
      process.env.P3AI_CONFIG_PATH ||
      join(process.cwd(), 'config', 'xnode-config.yaml');
      
    yamlConfig = yaml.load(readFileSync(configPath, 'utf8')) || {};
  } catch (e) {
    console.warn('Could not load config file, using default values');
  }

  // Configuration with defaults
  return {
    node: {
      name: process.env.P3AI_NODE_NAME || yamlConfig.node?.name || 'p3ai-xnode',
      port:
        (parseInt(process.env.P3AI_PORT ?? '', 10) || yamlConfig?.node?.port) ?? 3000,
      dataDir:
        process.env.P3AI_DATA_DIR || yamlConfig.node?.dataDir || './data',
      logLevel:
        process.env.P3AI_LOG_LEVEL || yamlConfig.node?.logLevel || 'info',
    },

    blockchain: {
      network:
        process.env.P3AI_BLOCKCHAIN_NETWORK ||
        yamlConfig.blockchain?.network ||
        'arbitrum',
      rpcUrl:
        process.env.P3AI_RPC_URL ||
        yamlConfig.blockchain?.arbitrumRpcUrl ||
        'https://arb1.arbitrum.io/rpc',
      registryContractAddress:
        process.env.P3AI_REGISTRY_CONTRACT ||
        yamlConfig.blockchain?.registryContractAddress,
      privateKey: process.env.P3AI_PRIVATE_KEY || null,
    },

    registry: {
      serviceEndpoint:
        process.env.P3AI_REGISTRY_ENDPOINT ||
        yamlConfig.registry?.serviceEndpoint ||
        'https://registry.p3ai.ai/api',
      refreshInterval:
        parseInt(process.env.P3AI_REGISTRY_REFRESH ?? '', 10) ||
        yamlConfig.registry?.refreshInterval ||
        3600,
    },

    security: {
      encryptionType:
        process.env.P3AI_ENCRYPTION_TYPE ||
        yamlConfig.security?.encryptionType ||
        'AES-256-GCM',
      keyRotationPeriod:
        parseInt(process.env.P3AI_KEY_ROTATION_PERIOD ?? '', 10) ||
        yamlConfig.security?.keyRotationPeriod ||
        7776000,
      tlsEnabled:
        process.env.P3AI_TLS_ENABLED === 'true' ||
        yamlConfig.security?.tlsEnabled ||
        false,
      tlsCert:
        process.env.P3AI_TLS_CERT ||
        yamlConfig.security?.tlsCert ||
        './certs/server.crt',
      tlsKey:
        process.env.P3AI_TLS_KEY ||
        yamlConfig.security?.tlsKey ||
        './certs/server.key',
    },

    storage: {
      type:
        process.env.P3AI_STORAGE_TYPE || yamlConfig.storage?.type || 'level',
      mongodb: {
        uri:
          process.env.P3AI_MONGODB_URI ||
          yamlConfig.storage?.mongodb?.uri ||
          null,
        database:
          process.env.P3AI_MONGODB_DB ||
          yamlConfig.storage?.mongodb?.database ||
          'p3ai',
      },
    },

    agents: {
      defaultCapabilities: (process.env.P3AI_DEFAULT_CAPABILITIES || '')
        .split(',')
        .filter(Boolean) ||
        yamlConfig.agents?.defaultCapabilities || [
          'TextProcessing',
          'DataAnalysis',
          'Communication',
        ],
      autoDiscovery:
        process.env.P3AI_AUTO_DISCOVERY === 'true' ||
        yamlConfig.agents?.autoDiscovery ||
        true,
      handshakeTimeout:
        parseInt(process.env.P3AI_HANDSHAKE_TIMEOUT ?? '', 10) ||
        yamlConfig.agents?.handshakeTimeout ||
        30,
      maxConcurrentRequests:
        parseInt(process.env.P3AI_MAX_CONCURRENT_REQUESTS ?? '', 10) ||
        yamlConfig.agents?.maxConcurrentRequests ||
        100,
    },

    communication: {
      protocol:
        process.env.P3AI_COMM_PROTOCOL ||
        yamlConfig.communication?.protocol ||
        'https',
      messageFormat:
        process.env.P3AI_MESSAGE_FORMAT ||
        yamlConfig.communication?.messageFormat ||
        'json',
      maxMessageSizeBytes:
        parseInt(process.env.P3AI_MAX_MESSAGE_SIZE ?? '', 10) ||
        yamlConfig.communication?.maxMessageSizeBytes ||
        1048576,
      compression:
        process.env.P3AI_COMPRESSION === 'true' ||
        yamlConfig.communication?.compression ||
        true,
    },

    tasks: {
      maxTTL:
        parseInt(process.env.P3AI_TASK_MAX_TTL ?? '', 10) ||
        yamlConfig.loop_detection?.maxTTL ||
        30,
      maxHops:
        parseInt(process.env.P3AI_TASK_MAX_HOPS ?? '', 10) ||
        yamlConfig.loop_detection?.maxHops ||
        10,
      stateCheckpointFrequency:
        parseInt(process.env.P3AI_STATE_CHECKPOINT_FREQ ?? '', 10) ||
        yamlConfig.loop_detection?.stateCheckpointFrequency ||
        5,
    },

    credentials: {
      defaultExpiryDays:
        parseInt(process.env.P3AI_DEFAULT_EXPIRY_DAYS ?? '', 10) ||
        yamlConfig.credentials?.defaultExpiryDays ||
        365,
      vcSchemas: {
        AgentCredential:
          process.env.P3AI_AGENT_CREDENTIAL_SCHEMA ||
          yamlConfig.credentials?.vcSchemas?.AgentCredential ||
          'https://p3ai.ai/schemas/agent-credential-v1.json',
        CapabilityCredential:
          process.env.P3AI_CAPABILITY_CREDENTIAL_SCHEMA ||
          yamlConfig.credentials?.vcSchemas?.CapabilityCredential ||
          'https://p3ai.ai/schemas/capability-credential-v1.json',
      },
    },
  };
};
