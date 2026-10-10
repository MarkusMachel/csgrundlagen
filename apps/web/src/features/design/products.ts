import {
  siAkamai,
  siAlgolia,
  siApacheairflow,
  siApachecassandra,
  siApachekafka,
  siApachepulsar,
  siAuth0,
  siCaddy,
  siCelery,
  siCloudflare,
  siCloudflareworkers,
  siCockroachlabs,
  siDocker,
  siElasticsearch,
  siEnvoyproxy,
  siFastly,
  siFirebase,
  siGooglecloud,
  siGooglecloudspanner,
  siGooglecloudstorage,
  siGooglepubsub,
  siKeycloak,
  siKong,
  siKubernetes,
  siMariadb,
  siMeilisearch,
  siMinio,
  siMongodb,
  siMysql,
  siNatsdotio,
  siNeon,
  siNginx,
  siOkta,
  siOpensearch,
  siPlanetscale,
  siPostgresql,
  siPusher,
  siRabbitmq,
  siRedis,
  siScylladb,
  siSocketdotio,
  siSupabase,
  siTemporal,
  siTraefikproxy,
  siUpstash,
  type SimpleIcon,
} from 'simple-icons';

import type { DesignKind } from '@/features/questions';

export type ProductGroup = 'oss' | 'aws' | 'azure' | 'gcp' | 'saas';

/**
 * A real product to build with. It counts as its generic `kind` when a design
 * is checked (Redis is a cache, SQS a queue), so any mix of vendors passes
 * the same rules.
 */
export interface DesignProduct {
  id: string;
  name: string;
  group: ProductGroup;
  kind: DesignKind;
  /** The brand's mark, from Simple Icons (CC0; the trademarks stay their owners'). */
  logo?: SimpleIcon;
  /** No logo we may use: a short label on the vendor's colour (AWS, Azure). */
  badge?: string;
}

/** Vendor colours for products shown as a badge: background and text. */
export const BADGE_TEXT: Record<ProductGroup, string> = {
  aws: '#FF9900',
  azure: '#FFFFFF',
  gcp: '#FFFFFF',
  oss: '#FFFFFF',
  saas: '#FFFFFF',
};

export const BADGE_COLOR: Record<ProductGroup, string> = {
  aws: '#232F3E',
  azure: '#0078D4',
  gcp: '#4285F4',
  oss: '#555555',
  saas: '#555555',
};

const oss = (id: string, name: string, kind: DesignKind, logo: SimpleIcon): DesignProduct => ({
  id,
  name,
  group: 'oss',
  kind,
  logo,
});
const saas = (id: string, name: string, kind: DesignKind, logo: SimpleIcon): DesignProduct => ({
  id,
  name,
  group: 'saas',
  kind,
  logo,
});
const aws = (id: string, name: string, kind: DesignKind, badge: string): DesignProduct => ({
  id: `aws-${id}`,
  name,
  group: 'aws',
  kind,
  badge,
});
const azure = (id: string, name: string, kind: DesignKind, badge: string): DesignProduct => ({
  id: `azure-${id}`,
  name,
  group: 'azure',
  kind,
  badge,
});
const gcp = (
  id: string,
  name: string,
  kind: DesignKind,
  logo: SimpleIcon = siGooglecloud,
): DesignProduct => ({ id: `gcp-${id}`, name, group: 'gcp', kind, logo });

export const DESIGN_PRODUCTS: DesignProduct[] = [
  // open source
  oss('redis', 'Redis', 'cache', siRedis),
  oss('postgresql', 'PostgreSQL', 'sql', siPostgresql),
  oss('mysql', 'MySQL', 'sql', siMysql),
  oss('mariadb', 'MariaDB', 'sql', siMariadb),
  oss('cockroachdb', 'CockroachDB', 'sql', siCockroachlabs),
  oss('mongodb', 'MongoDB', 'nosql', siMongodb),
  oss('cassandra', 'Apache Cassandra', 'nosql', siApachecassandra),
  oss('scylladb', 'ScyllaDB', 'nosql', siScylladb),
  oss('kafka', 'Apache Kafka', 'queue', siApachekafka),
  oss('rabbitmq', 'RabbitMQ', 'queue', siRabbitmq),
  oss('nats', 'NATS', 'queue', siNatsdotio),
  oss('pulsar', 'Apache Pulsar', 'queue', siApachepulsar),
  oss('elasticsearch', 'Elasticsearch', 'search', siElasticsearch),
  oss('opensearch', 'OpenSearch', 'search', siOpensearch),
  oss('meilisearch', 'Meilisearch', 'search', siMeilisearch),
  oss('nginx', 'NGINX', 'load-balancer', siNginx),
  oss('envoy', 'Envoy', 'load-balancer', siEnvoyproxy),
  oss('traefik', 'Traefik', 'load-balancer', siTraefikproxy),
  oss('caddy', 'Caddy', 'load-balancer', siCaddy),
  oss('kong', 'Kong Gateway', 'api-gateway', siKong),
  oss('kubernetes', 'Kubernetes', 'service', siKubernetes),
  oss('docker', 'Docker container', 'service', siDocker),
  oss('minio', 'MinIO', 'object-storage', siMinio),
  oss('celery', 'Celery', 'worker', siCelery),
  oss('temporal', 'Temporal', 'scheduler', siTemporal),
  oss('airflow', 'Apache Airflow', 'scheduler', siApacheairflow),
  oss('keycloak', 'Keycloak', 'auth', siKeycloak),
  oss('socketio', 'Socket.IO', 'websocket', siSocketdotio),

  // AWS
  aws('route53', 'Route 53', 'dns', 'R53'),
  aws('cloudfront', 'CloudFront', 'cdn', 'CF'),
  aws('alb', 'Elastic Load Balancing', 'load-balancer', 'ELB'),
  aws('api-gateway', 'API Gateway', 'api-gateway', 'APIG'),
  aws('waf', 'AWS WAF', 'rate-limiter', 'WAF'),
  aws('cognito', 'Cognito', 'auth', 'COG'),
  aws('ec2', 'EC2', 'service', 'EC2'),
  aws('ecs', 'ECS / Fargate', 'service', 'ECS'),
  aws('eks', 'EKS', 'service', 'EKS'),
  aws('lambda', 'Lambda', 'worker', 'λ'),
  aws('eventbridge', 'EventBridge Scheduler', 'scheduler', 'EB'),
  aws('sqs', 'SQS', 'queue', 'SQS'),
  aws('sns', 'SNS', 'queue', 'SNS'),
  aws('kinesis', 'Kinesis', 'queue', 'KIN'),
  aws('elasticache', 'ElastiCache', 'cache', 'EC'),
  aws('rds', 'RDS', 'sql', 'RDS'),
  aws('aurora', 'Aurora', 'sql', 'AUR'),
  aws('rds-replica', 'RDS read replica', 'replica', 'RR'),
  aws('dynamodb', 'DynamoDB', 'nosql', 'DDB'),
  aws('s3', 'S3', 'object-storage', 'S3'),
  aws('opensearch', 'OpenSearch Service', 'search', 'OS'),

  // Azure
  azure('dns', 'Azure DNS', 'dns', 'DNS'),
  azure('front-door', 'Front Door', 'cdn', 'AFD'),
  azure('load-balancer', 'Load Balancer', 'load-balancer', 'LB'),
  azure('app-gateway', 'Application Gateway', 'load-balancer', 'AGW'),
  azure('apim', 'API Management', 'api-gateway', 'APIM'),
  azure('entra-id', 'Entra ID', 'auth', 'ID'),
  azure('app-service', 'App Service', 'service', 'APP'),
  azure('aks', 'AKS', 'service', 'AKS'),
  azure('container-apps', 'Container Apps', 'service', 'ACA'),
  azure('functions', 'Functions', 'worker', 'FN'),
  azure('service-bus', 'Service Bus', 'queue', 'SB'),
  azure('event-hubs', 'Event Hubs', 'queue', 'EH'),
  azure('web-pubsub', 'Web PubSub', 'websocket', 'WPS'),
  azure('cache-redis', 'Azure Cache for Redis', 'cache', 'ACR'),
  azure('sql', 'Azure SQL', 'sql', 'SQL'),
  azure('cosmos-db', 'Cosmos DB', 'nosql', 'COS'),
  azure('blob', 'Blob Storage', 'object-storage', 'BLOB'),
  azure('ai-search', 'AI Search', 'search', 'SRCH'),

  // Google Cloud
  gcp('cloud-dns', 'Cloud DNS', 'dns'),
  gcp('cloud-cdn', 'Cloud CDN', 'cdn'),
  gcp('load-balancing', 'Cloud Load Balancing', 'load-balancer'),
  gcp('cloud-run', 'Cloud Run', 'service'),
  gcp('gke', 'GKE', 'service'),
  gcp('cloud-functions', 'Cloud Functions', 'worker'),
  gcp('cloud-scheduler', 'Cloud Scheduler', 'scheduler'),
  gcp('pubsub', 'Pub/Sub', 'queue', siGooglepubsub),
  gcp('memorystore', 'Memorystore', 'cache'),
  gcp('cloud-sql', 'Cloud SQL', 'sql'),
  gcp('spanner', 'Spanner', 'sql', siGooglecloudspanner),
  gcp('firestore', 'Firestore', 'nosql', siFirebase),
  gcp('cloud-storage', 'Cloud Storage', 'object-storage', siGooglecloudstorage),

  // services
  saas('cloudflare', 'Cloudflare', 'cdn', siCloudflare),
  saas('cloudflare-workers', 'Cloudflare Workers', 'worker', siCloudflareworkers),
  saas('fastly', 'Fastly', 'cdn', siFastly),
  saas('akamai', 'Akamai', 'cdn', siAkamai),
  saas('auth0', 'Auth0', 'auth', siAuth0),
  saas('okta', 'Okta', 'auth', siOkta),
  saas('algolia', 'Algolia', 'search', siAlgolia),
  saas('supabase', 'Supabase', 'sql', siSupabase),
  saas('neon', 'Neon', 'sql', siNeon),
  saas('planetscale', 'PlanetScale', 'sql', siPlanetscale),
  saas('upstash', 'Upstash Redis', 'cache', siUpstash),
  saas('pusher', 'Pusher', 'websocket', siPusher),
];

const byId = new Map(DESIGN_PRODUCTS.map((p) => [p.id, p]));

export const productById = (id: string | undefined) => (id ? byId.get(id) : undefined);

export const PRODUCT_GROUPS: ProductGroup[] = ['oss', 'aws', 'azure', 'gcp', 'saas'];
