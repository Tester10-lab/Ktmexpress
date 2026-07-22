/**
 * useDeliveryCharge — Auto-fetches the delivery charge from admin-configured rules or pricing engine.
 *
 * Triggers when fromBranch, toBranch, AND weight are set.
 * Debounces weight input by 300ms to avoid excessive API calls.
 *
 * @param {string} fromBranch
 * @param {string} toBranch
 * @param {number|string} weight
 * @param {string} [city]
 * @returns {{ charge: number, loading: boolean, error: string|null, ruleDetail: object|null }}
 */
import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const EMPTY_BRANCH = ['', '--------', null, undefined];

export function useDeliveryCharge(fromBranch, toBranch, weight, city = '') {
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

    // Debounce 300ms on weight / city / branch changes
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const w = Number(weight) || 0;
        const res = await api.get('/delivery-charges/calculate', {
          params: { from: fromBranch, to: toBranch, weight: w, city: city || '' },
        });
        if (res.data.success) {
          setCharge(res.data.data.charge);
          setRuleDetail(res.data.data);
          setError(null);
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
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [fromBranch, toBranch, weight, city]);

  return { charge, loading, error, ruleDetail };
}

export default useDeliveryCharge;
