export interface LoginState {
  error: string;
  success: boolean;
  message: string | null;
  redirect?: string;
  isPending?:boolean
}
