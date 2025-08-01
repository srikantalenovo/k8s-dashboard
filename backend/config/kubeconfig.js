const { KubeConfig } = require('@kubernetes/client-node');

const kc = new KubeConfig();
if (process.env.NODE_ENV === 'production') {
  kc.loadFromCluster(); // In-cluster config
} else {
  kc.loadFromDefault(); // Local kubeconfig
}

module.exports = kc;
