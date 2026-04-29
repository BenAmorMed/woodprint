-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('CLIENT', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('EN_ATTENTE', 'EN_COURS_DE_TRAITEMENT', 'EXPEDIEE', 'LIVREE', 'ANNULEE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT,
    "jeton_reinitialisation" TEXT,
    "role" "RoleUtilisateur" NOT NULL DEFAULT 'CLIENT',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleSysteme" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ModuleSysteme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionAdmin" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,

    CONSTRAINT "PermissionAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie_parente_id" UUID,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "prix_de_base" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "categorie_id" UUID NOT NULL,
    "images_produit" TEXT[],
    "schema_personnalisation" JSONB NOT NULL DEFAULT '[]',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VarianteProduit" (
    "id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "attributs" JSONB NOT NULL,
    "modificateur_prix" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VarianteProduit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID,
    "code_confirmation" TEXT,
    "email_client" TEXT NOT NULL,
    "nom_client" TEXT NOT NULL,
    "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE',
    "montant_total" DECIMAL(10,2) NOT NULL,
    "adresse_livraison" JSONB NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneCommande" (
    "id" UUID NOT NULL,
    "commande_id" UUID NOT NULL,
    "variante_produit_id" UUID NOT NULL,
    "quantite" INTEGER NOT NULL,
    "personnalisations_utilisateur" JSONB NOT NULL,

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeDiffusion" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_inscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListeDiffusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avis" (
    "id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "urls_media" TEXT[],
    "reponse_admin" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offre" (
    "id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "image_banniere" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "date_debut" TIMESTAMP(3),
    "date_fin" TIMESTAMP(3),

    CONSTRAINT "Offre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametresBoutique" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "frais_livraison" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "seuil_livraison_gratuite" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "banniere_annonce" TEXT,

    CONSTRAINT "ParametresBoutique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalisationAudit" (
    "id" UUID NOT NULL,
    "utilisateur_id" UUID NOT NULL,
    "entite_cible" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "adresse_ip" TEXT,
    "date_action" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalisationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PromotionProduit" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PromotionProduit_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleSysteme_nom_key" ON "ModuleSysteme"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionAdmin_utilisateur_id_module_id_key" ON "PermissionAdmin"("utilisateur_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "VarianteProduit_sku_key" ON "VarianteProduit"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_code_confirmation_key" ON "Commande"("code_confirmation");

-- CreateIndex
CREATE UNIQUE INDEX "ListeDiffusion_email_key" ON "ListeDiffusion"("email");

-- CreateIndex
CREATE INDEX "_PromotionProduit_B_index" ON "_PromotionProduit"("B");

-- AddForeignKey
ALTER TABLE "PermissionAdmin" ADD CONSTRAINT "PermissionAdmin_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionAdmin" ADD CONSTRAINT "PermissionAdmin_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "ModuleSysteme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categorie" ADD CONSTRAINT "Categorie_categorie_parente_id_fkey" FOREIGN KEY ("categorie_parente_id") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VarianteProduit" ADD CONSTRAINT "VarianteProduit_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneCommande" ADD CONSTRAINT "LigneCommande_variante_produit_id_fkey" FOREIGN KEY ("variante_produit_id") REFERENCES "VarianteProduit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avis" ADD CONSTRAINT "Avis_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalisationAudit" ADD CONSTRAINT "JournalisationAudit_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromotionProduit" ADD CONSTRAINT "_PromotionProduit_A_fkey" FOREIGN KEY ("A") REFERENCES "Offre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromotionProduit" ADD CONSTRAINT "_PromotionProduit_B_fkey" FOREIGN KEY ("B") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
