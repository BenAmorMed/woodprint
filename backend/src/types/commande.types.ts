export interface LigneCommandeDTO {
  variante_produit_id: string;
  quantite: number;
  personnalisations_utilisateur: Record<string, any>;
}

export interface CreerCommandeDTO {
  utilisateur_id?: string;
  email_client: string;
  nom_client: string;
  adresse_livraison: any;
  lignes: LigneCommandeDTO[];
}
