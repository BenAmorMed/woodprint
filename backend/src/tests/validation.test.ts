import { validerPersonnalisationsUtilisateur } from '../services/validation.service';
import { SchemaPersonnalisation } from '../types/produit.types';

describe('Validation Métier des Personnalisations (Unit Test)', () => {

  const schemaHybride: SchemaPersonnalisation = [
    { id: 'logo', nom: 'Logo', type: 'image', requis: true },
    { id: 'texte_dos', nom: 'Texte Dos', type: 'texte', requis: false },
    { id: 'finition', nom: 'Finition', type: 'select', requis: true, options: ['Mat', 'Brillant'] },
    { id: 'position', nom: 'Position', type: 'coordonnees', requis: true }
  ];

  it('Scénario 1: Doit valider une configuration parfaitement formatée', () => {
    const reponsesClient = {
      logo: 'https://mon-stockage/logo.png',
      texte_dos: 'WoodPrint Forever',
      finition: 'Mat',
      position: { x: 100, y: 250 }
    };

    const estValide = validerPersonnalisationsUtilisateur(reponsesClient, schemaHybride);
    expect(estValide).toBe(true);
  });

  it('Scénario 2: Doit échouer si une option select requise n\'est pas choisie parmi les options', () => {
    const reponsesFautives = {
      logo: 'https://mon-stockage/logo.png',
      finition: 'Satiné',
      position: { x: 100, y: 250 }
    };

    const estValide = validerPersonnalisationsUtilisateur(reponsesFautives, schemaHybride);
    expect(estValide).toBe(false);
  });

  it('Scénario 3: Doit échouer si le client injecte une chaîne pour des coordonnées', () => {
    const reponsesFautives = {
      logo: 'https://mon-stockage/logo.png',
      finition: 'Brillant',
      position: 'injection_string_malveillante'
    };

    const estValide = validerPersonnalisationsUtilisateur(reponsesFautives, schemaHybride);
    expect(estValide).toBe(false);
  });

  it('Scénario 4: Doit passer lorsqu\'une personnalisation optionnelle est omise', () => {
    const reponsesSansOption = {
      logo: 'https://mon-stockage/logo.png',
      finition: 'Mat',
      position: { x: 0, y: 0 }
    };

    const estValide = validerPersonnalisationsUtilisateur(reponsesSansOption, schemaHybride);
    expect(estValide).toBe(true);
  });
});
