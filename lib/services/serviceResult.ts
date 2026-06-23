export type ServiceResult<T> = {
  data: T | null
  error: string | null
}

export async function executeQuery<T>(
  query: PromiseLike<{ data: T | null; error: any }>
): Promise<ServiceResult<T>> {
  try {
    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error
        ? err.message
        : 'Erro inesperado ao acessar o banco de dados'
    }
  }
}