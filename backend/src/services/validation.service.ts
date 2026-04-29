import { ChampPersonnalisation } from '../types/produit.types';

const TYPES_AUTORISES = ['texte', 'image', 'coordonnees', 'select', 'nombre'];

export const validerSchemaPersonnalisation = (schema: any): boolean => {
  if (!Array.isArray(schema)) return false;

  for (const champ of schema) {
    if (!champ.id || typeof champ.id !== 'string') return false;
    if (!champ.nom || typeof champ.nom !== 'string') return false;
    if (!TYPES_AUTORISES.includes(champ.type)) return false;
    if (typeof champ.requis !== 'boolean') return false;

    if (champ.type === 'select') {
      if (!Array.isArray(champ.options) || !champ.options.every((opt: any) => typeof opt === 'string')) {
        return false;
      }
    }
  }
  return true;
};

export const validerPersonnalisationsUtilisateur = (
  reponses: Record<string, any>,
  schema: ChampPersonnalisation[]
): boolean => {
  if (!reponses || typeof reponses !== 'object') return false;

  for (const champ of schema) {
    const valeur = reponses[champ.id];

    if (champ.requis && (valeur === undefined || valeur === null || valeur === '')) {
      return false;
    }

    if (valeur !== undefined && valeur !== null && valeur !== '') {
      switch (champ.type) {
        case 'texte':
        case 'image':
          if (typeof valeur !== 'string') return false;
          break;
        case 'nombre':
          if (typeof valeur !== 'number') return false;
          break;
        case 'select':
          if (!champ.options?.includes(valeur)) return false;
          break;
        case 'coordonnees':
          if (typeof valeur !== 'object' || valeur.x === undefined || valeur.y === undefined) return false;
          break;
      }
    }
  }
  return true;
};
