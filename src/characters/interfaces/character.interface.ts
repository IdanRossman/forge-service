export interface Character {
  id: string;
  user_id: string;
  name: string;
  job: string;
  level?: number;
  created_at?: Date;
  updated_at?: Date;
}
