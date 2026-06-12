/**
 * useDeliveryCharge — Auto-fetches the delivery charge from admin-configured rules.
 *
 * Triggers when fromBranch, toBranch, AND weight are all set.
 * Debounces weight input by 500ms to avoid excessive API calls.
 *
 * @param {string} fromBranch
 * @param {string} toBranch
 * @param {number|string} weight
 * @returns {{ charge: number, loading: boolean, error: string|null, ruleDetail: object|null }}
 */
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const EMPTY_BRANCH = ['', '--------', null, undefined];

export function useDeliveryCharge(fromBranch, toBranch, weight) {
  const [charge, setCharge]         = useState(null);   // null = not fetched yet
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [ruleDetail, setRuleDetail] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Clear state if required fields are missing
    if (
      EMPTY_BRANCH.includes(fromBranch) ||
      EMPTY_BRANCH.includes(toBranch)
    ) {
      setCharge(null);
      setError(null);
      setRuleDetail(null);
      return;
    }

    // Validate same-branch immediately
    if (fromBranch.trim().toLowerCase() === toBranch.trim().toLowerCase()) {
      setCharge(null);
      setError('From and To branch cannot be the same');
      setRuleDetail(null);
      return;
    }

    // Debounce 500ms on weight changes
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const w = Number(weight) || 0;
        const res = await api.get('/delivery-charges/calculate', {
          params: { from: fromBranch, to: toBranch, weight: w },
        });
        if (res.data.success) {
          setCharge(res.data.data.charge);
          setRuleDetail(res.data.data);
        } else {
          setCharge(null);
          setError(res.data.message || 'Rate not configured');
        }
      } catch (err) {
        setCharge(null);
        if (err.response?.status === 404) {
          setError('Delivery rate not set for this route. Contact admin.');
        } else if (err.response?.status === 400) {
          setError(err.response.data.message || 'Invalid route');
        } else {
          setError('Failed to fetch delivery rate');
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [fromBranch, toBranch, weight]);

  return { charge, loading, error, ruleDetail };
}

export default useDeliveryCharge;
