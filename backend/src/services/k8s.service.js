import { KubeConfig, CoreV1Api } from '@kubernetes/client-node';

const kc = new KubeConfig();
kc.loadFromDefault();

export const coreV1Api = kc.makeApiClient(CoreV1Api);
