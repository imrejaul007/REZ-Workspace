/**
 * REZ Forms SDK - React Hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, Form, Submission, Analytics, FormField } from './index';

// Create default client
const defaultClient = createClient({
  apiKey: process.env.NEXT_PUBLIC_REZ_FORMS_API_KEY || '',
  baseUrl: process.env.NEXT_PUBLIC_REZ_FORMS_URL || 'https://api.rez.money/forms',
});

/**
 * Hook to fetch and manage a form
 */
export function useForm(formId: string, client = defaultClient) {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForm = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.forms.get(formId);
      setForm(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formId, client]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const updateForm = async (updates: Partial<Form>) => {
    try {
      const updated = await client.forms.update(formId, updates);
      setForm(updated);
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addField = async (field: Omit<FormField, 'id'>) => {
    try {
      const newField = await client.forms.addField(formId, field);
      await fetchForm();
      return newField;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { form, loading, error, refetch: fetchForm, updateForm, addField };
}

/**
 * Hook to manage form submission
 */
export function useSubmission(formId: string, client = defaultClient) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const submit = async (answers: Array<{ fieldId: string; value: any }>) => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await client.submissions.submit(formId, { answers });
      setSubmission(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSubmission(null);
    setError(null);
  };

  return { submit, submitting, error, submission, reset };
}

/**
 * Hook to fetch form submissions
 */
export function useFormSubmissions(formId: string, options = { page: 1, pageSize: 20 }, client = defaultClient) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.submissions.list(formId, options);
      setSubmissions(data.submissions);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formId, options.page, options.pageSize, client]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, total, loading, error, refetch: fetchSubmissions };
}

/**
 * Hook to fetch form analytics
 */
export function useFormAnalytics(formId: string, client = defaultClient) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.forms.getAnalytics(formId);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [formId, client]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}

/**
 * Hook to generate form with AI
 */
export function useAIFormGenerator(client = defaultClient) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (prompt: string) => {
    try {
      setGenerating(true);
      setError(null);
      const result = await client.ai.generate(prompt);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const generateAndSave = async (prompt: string, title?: string) => {
    try {
      setGenerating(true);
      setError(null);
      const result = await client.ai.generateAndSave({ prompt, title });
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generateAndSave, generating, error };
}

/**
 * Hook to manage forms list
 */
export function useForms(client = defaultClient) {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.forms.list();
      setForms(data.forms);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const createForm = async (data: { title: string; description?: string }) => {
    try {
      const newForm = await client.forms.create(data);
      setForms(prev => [newForm, ...prev]);
      return newForm;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteForm = async (formId: string) => {
    try {
      await client.forms.delete(formId);
      setForms(prev => prev.filter(f => f.id !== formId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const duplicateForm = async (formId: string) => {
    try {
      const cloned = await client.forms.clone(formId);
      setForms(prev => [cloned, ...prev]);
      return cloned;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { forms, loading, error, refetch: fetchForms, createForm, deleteForm, duplicateForm };
}