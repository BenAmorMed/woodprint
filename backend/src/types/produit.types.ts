export type TypeChampPersonnalisation = 'texte' | 'image' | 'coordonnees' | 'select' | 'nombre';

export interface ChampPersonnalisation {
  id: string;
  nom: string;
  type: TypeChampPersonnalisation;
  requis: boolean;
  options?: string[]; // Utilisé si le type est 'select'
}

export type SchemaPersonnalisation = ChampPersonnalisation[];
