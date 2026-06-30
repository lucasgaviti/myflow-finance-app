import {
    useEffect,
    useState,
  } from 'react';
  
  import { supabase } from '../lib/supabase';
  
  import type {
    CreateTransactionImportData,
    TransactionImport,
    TransactionImportStatus,
  } from '../types/transactionImport';
  
  type UpdateTransactionImportData = {
    imported_transactions?: number;
    status?: TransactionImportStatus;
  };
  
  function mapImport(data: TransactionImport): TransactionImport {
    return {
      ...data,
  
      total_transactions:
        Number(data.total_transactions),
  
      imported_transactions:
        Number(data.imported_transactions),
    };
  }
  
  export function useTransactionImports() {
    const [
      imports,
      setImports,
    ] = useState<TransactionImport[]>([]);
  
    const [loading, setLoading] =
      useState(true);
  
    async function fetchImports() {
      setLoading(true);
  
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        setImports([]);
        setLoading(false);
        return;
      }
  
      const { data, error } = await supabase
        .from('transaction_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        });
  
      if (error) {
        console.error(
          'Erro ao buscar importações:',
          error,
        );
  
        setLoading(false);
        return;
      }
  
      setImports(
        (data ?? []).map(mapImport),
      );
  
      setLoading(false);
    }
  
    async function createImport(
      importData: CreateTransactionImportData,
    ) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      if (!user) {
        throw new Error(
          'Usuário não autenticado.',
        );
      }
  
      const { data, error } = await supabase
        .from('transaction_imports')
        .insert({
          user_id: user.id,
  
          file_name: importData.file_name,
  
          source: importData.source,
  
          total_transactions:
            importData.total_transactions,
  
          imported_transactions:
            importData.imported_transactions,
  
          status: importData.status,
        })
        .select()
        .single();
  
      if (error) {
        throw error;
      }
  
      const mappedImport =
        mapImport(data);
  
      setImports((prev) => [
        mappedImport,
        ...prev,
      ]);
  
      return mappedImport;
    }
  
    async function updateImport(
      id: string,
      importData: UpdateTransactionImportData,
    ) {
      const { data, error } = await supabase
        .from('transaction_imports')
        .update({
          imported_transactions:
            importData.imported_transactions,
  
          status: importData.status,
        })
        .eq('id', id)
        .select()
        .single();
  
      if (error) {
        throw error;
      }
  
      const mappedImport =
        mapImport(data);
  
      setImports((prev) =>
        prev.map((item) =>
          item.id === id
            ? mappedImport
            : item,
        ),
      );
  
      return mappedImport;
    }
  
    async function removeImport(id: string) {
      const { error } = await supabase
        .from('transaction_imports')
        .delete()
        .eq('id', id);
  
      if (error) {
        throw error;
      }
  
      setImports((prev) =>
        prev.filter((item) => item.id !== id),
      );
    }
  
    useEffect(() => {
      fetchImports();
    }, []);
  
    return {
      imports,
  
      loading,
  
      fetchImports,
  
      createImport,
  
      updateImport,
  
      removeImport,
    };
  }