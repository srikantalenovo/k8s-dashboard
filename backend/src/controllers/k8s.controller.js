import { NotFoundError, InternalServerError } from '../utils/errors.js';
import k8sService from '../services/k8s.service.js';

/**
 * Get cluster info
 */
export const getClusterInfo = async (req, res) => {
  try {
    const clusterInfo = await k8sService.getClusterInfo();
    res.json({ success: true, data: clusterInfo });
  } catch (error) {
    throw new InternalServerError('Failed to fetch cluster information');
  }
};

/**
 * List pods
 */
export const getPods = async (req, res) => {
  try {
    const pods = await k8sService.getPods();
    res.json({ success: true, data: pods });
  } catch (error) {
    throw new InternalServerError('Failed to fetch pods');
  }
};

/**
 * Delete a pod
 */
export const deletePod = async (req, res) => {
  try {
    const { name } = req.params;
    const result = await k8sService.deletePod(name);

    if (!result) {
      throw new NotFoundError(`Pod ${name} not found or could not be deleted`);
    }

    res.json({ success: true, message: `Pod ${name} deleted successfully` });
  } catch (error) {
    throw new InternalServerError('Failed to delete pod');
  }
};

/**
 * Restart a pod
 */
export const restartPod = async (req, res) => {
  try {
    const { name } = req.params;
    const result = await k8sService.restartPod(name);

    if (!result) {
      throw new NotFoundError(`Pod ${name} not found or could not be restarted`);
    }

    res.json({ success: true, message: `Pod ${name} restarted successfully` });
  } catch (error) {
    throw new InternalServerError('Failed to restart pod');
  }
};
