/*** RisnaEstate - API Hooks for React ***/

import { useState, useEffect } from 'react'
import { propertyApi, leadApi, visaApi, referralApi, brokerApi } from './api'

// ===== Property Hooks =====

export function useProperties(filters = {}) {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = async () => {
    try {
      setLoading(true)
      const res = await propertyApi.search(filters)
      setData(res.data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [JSON.stringify(filters)])

  return { data, loading, error, refetch: fetch }
}

export function useProperty(id: string) {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    propertyApi.getById(id)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  return { data, loading }
}

// ===== Lead Hooks =====

export function useLeads(brokerId?: string) {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leadApi.getDashboard(brokerId)
      .then(res => setData(res.data?.leads || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [brokerId])

  return { data, loading }
}

export function useHotLeads() {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leadApi.getHot()
      .then(res => setData(res.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

// ===== Visa Hooks =====

export function useVisaPrograms() {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    visaApi.getPrograms()
      .then(res => setData(res.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

export function useVisaEligibility(data: unknown) {
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const check = async () => {
    setLoading(true)
    try {
      const res = await visaApi.checkEligibility(data as Record<string, unknown>)
      setResult(res.data)
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, check }
}

// ===== Referral Hooks =====

export function useReferralEarnings(userId: string) {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    referralApi.getEarnings(userId)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId])

  return { data, loading }
}

export function useReferralLeaderboard() {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    referralApi.getLeaderboard()
      .then(res => setData(res.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

// ===== Broker Hooks =====

export function useBrokerDashboard() {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    brokerApi.getDashboard()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
