/**
 * Configuration centralisée de tous les textes d'aide contextuelle
 * Utilisé par le composant HelpIcon pour afficher l'aide à l'utilisateur
 */

export const helpContent = {
  // === PAGES ===
  pages: {
    dashboard: {
      title: 'Tableau de bord',
      description: 'Votre tableau de bord centralise toutes les informations importantes selon votre rôle.',
      manager: 'En tant que manager, vous pouvez valider les demandes, consulter les statistiques et gérer votre équipe.',
      chef: 'En tant que chef de service, vous validez les demandes de votre équipe avant qu\'elles ne soient soumises au manager.',
      caissier: 'En tant que caissier, vous gérez les opérations de caisse : encaissements, décaissements et billetage.',
      employe: 'En tant qu\'employé, vous pouvez créer des demandes de paiement et suivre leur statut.',
    },
    newRequest: {
      title: 'Créer une nouvelle demande',
      description: 'Formulaire de création d\'une demande de paiement. Remplissez tous les champs requis.',
      titre: 'Donnez un titre clair et descriptif à votre demande (ex: "Achat de fournitures de bureau").',
      type: 'Sélectionnez le type de demande : Fiche de besoin, Ordre de mission, Transport ou Divers.',
      motif: 'Décrivez en détail le motif de la demande. Plus les détails sont précis, plus la validation sera rapide.',
      beneficiaire: 'Choisissez le bénéficiaire : vous-même ou un autre utilisateur de la liste. Vous pouvez aussi saisir un nom manuellement.',
      lignes: 'Ajoutez les lignes détaillées de votre demande : désignation, quantité, prix unitaire. Le total se calcule automatiquement.',
      compteComptable: 'Sélectionnez le compte comptable associé à chaque ligne pour la comptabilisation.',
    },
    requests: {
      title: 'Mes demandes',
      description: 'Liste de toutes vos demandes avec leur statut actuel.',
      statut: 'Statuts possibles : BROUILLON (non envoyée), ATTENTE CHEF (en validation), ATTENTE MANAGER, BON À PAYER (validée), PAYÉE, REFUSÉE.',
      filtres: 'Utilisez les filtres pour trouver rapidement une demande spécifique par statut, date ou montant.',
    },
    chefValidation: {
      title: 'Validation des demandes',
      description: 'En tant que chef de service, vous devez valider les demandes de votre équipe avant qu\'elles soient soumises au manager.',
      action: 'Cliquez sur une demande pour voir les détails. Vous pouvez ensuite la valider ou la refuser avec un motif.',
    },
    managerValidation: {
      title: 'Validation manager',
      description: 'Validez ou refusez les demandes qui ont été approuvées par les chefs de service.',
      bonAPayer: 'Une demande validée devient un "Bon à payer" et peut être traitée par la caisse.',
    },
    workstation: {
      title: 'Poste de travail caissier',
      description: 'Interface principale pour gérer les opérations de caisse.',
      solde: 'Le solde affiché correspond au montant disponible dans votre caisse actuellement.',
      encaissement: 'Enregistrez un encaissement (entrée d\'argent) avec le mode de paiement utilisé.',
      decaissement: 'Effectuez un décaissement (sortie d\'argent) en sélectionnant une demande validée.',
      billetage: 'Le billetage permet de compter et vérifier les espèces dans votre caisse.',
      transfert: 'Transférez de l\'argent vers une autre caisse si nécessaire.',
    },
    audit: {
      title: 'Journal d\'audit',
      description: 'Consultez l\'historique complet de toutes les actions effectuées dans le système.',
      filtres: 'Filtrez les entrées par utilisateur, action, date ou entité concernée.',
    },
    historique: {
      title: 'Historique des opérations',
      description: 'Visualisez toutes les opérations de caisse passées avec leurs détails.',
    },
    profile: {
      title: 'Mon profil',
      description: 'Consultez et modifiez vos informations personnelles.',
      password: 'Changez votre mot de passe régulièrement pour sécuriser votre compte.',
    },
  },

  // === COMPOSANTS ===
  components: {
    requestBonViewer: {
      title: 'Détail de la demande',
      description: 'Vue détaillée d\'une demande avec toutes ses informations. Vous pouvez voir toutes les lignes, le statut, et les signatures.',
      print: 'Cliquez sur "Imprimer" pour générer un PDF de cette demande. Le PDF peut être sauvegardé ou envoyé par email.',
      statut: 'Le statut est affiché en filigrane sur le document pour éviter les falsifications.',
      numeroReference: 'Le numéro de référence unique de la demande. Utilisez-le pour retrouver rapidement une demande.',
      montantTotal: 'Le montant total de la demande, calculé à partir de toutes les lignes.',
      signatures: 'Les signatures indiquent qui a validé la demande à chaque étape du processus.',
      lignes: 'Détail de tous les articles ou services demandés avec leurs quantités et prix.',
    },
    newDemandeModal: {
      title: 'Nouvelle demande rapide',
      description: 'Créez une demande simple sans passer par le formulaire complet. Pour des demandes détaillées, utilisez le formulaire complet.',
      montant: 'Saisissez le montant total de la demande en FCFA. Ce montant sera le montant global sans détail par ligne.',
      titre: 'Donnez un titre clair à votre demande (ex: "Achat fournitures").',
      type: 'Sélectionnez le type de demande parmi les options disponibles.',
      motif: 'Décrivez brièvement le motif de la demande.',
    },
    encaissementModal: {
      title: 'Enregistrer un encaissement',
      description: 'Enregistrez une entrée d\'argent dans la caisse. Un encaissement augmente le solde de votre caisse.',
      mode: 'Sélectionnez le mode de paiement utilisé : espèces, chèque, virement, etc. Le mode détermine comment l\'argent a été reçu.',
      montant: 'Saisissez le montant reçu en FCFA. Ce montant sera ajouté au solde de la caisse.',
      motif: 'Décrivez la raison de cet encaissement (ex: "Vente Client Dupont", "Remboursement facture", etc.). Ce motif apparaîtra dans le journal.',
      reference: 'Optionnel : ajoutez une référence (numéro de chèque, virement, etc.) pour faciliter le suivi.',
    },
    decaissementModal: {
      title: 'Effectuer un décaissement',
      description: 'Sortez de l\'argent de la caisse pour payer une demande validée. Un décaissement diminue le solde de votre caisse.',
      demande: 'Sélectionnez la demande à payer parmi celles validées (Bon à payer). Le montant sera pré-rempli automatiquement.',
      mode: 'Choisissez le mode de paiement : espèces, chèque, virement, etc. Important pour la traçabilité.',
      justificatif: 'Téléchargez le justificatif de paiement (facture, reçu, etc.). Le justificatif est obligatoire pour les décaissements.',
      beneficiaire: 'Indiquez le nom de la personne ou entité qui reçoit le paiement.',
      motif: 'Décrivez la raison du décaissement. Si vous payez une demande, le motif est pré-rempli.',
      montant: 'Le montant à décaisser. Si vous payez une demande, ce montant est fixe et correspond au montant de la demande.',
      modeDetaille: 'Activez le mode détaillé pour saisir plusieurs lignes d\'articles au lieu d\'un montant global.',
    },
    billetageModal: {
      title: 'Billetage de caisse',
      description: 'Comptez et vérifiez les espèces dans votre caisse.',
      instructions: 'Saisissez le nombre de billets/pieces pour chaque coupure. Le total est calculé automatiquement.',
      validation: 'Le billetage permet de vérifier que le solde théorique correspond au solde réel.',
    },
    transfertSendModal: {
      title: 'Transférer vers une autre caisse',
      description: 'Transférez de l\'argent de votre caisse vers une autre caisse. Le transfert doit être accepté par le caissier de destination.',
      caisse: 'Sélectionnez la caisse de destination. Assurez-vous que la caisse est active et que le caissier est disponible.',
      montant: 'Saisissez le montant à transférer en FCFA. Vérifiez que votre solde est suffisant.',
      motif: 'Indiquez le motif du transfert (ex: "Approvisionnement", "Rééquilibrage"). Ce motif sera visible par le caissier de destination.',
    },
    requestLinesEditor: {
      title: 'Éditeur de lignes',
      description: 'Ajoutez et modifiez les lignes détaillées de votre demande. Chaque ligne représente un article ou service à payer.',
      add: 'Cliquez sur "+" pour ajouter une nouvelle ligne. Vous devez avoir au moins une ligne.',
      delete: 'Cliquez sur la poubelle pour supprimer une ligne. Vous ne pouvez pas supprimer la dernière ligne.',
      compte: 'Sélectionnez le compte comptable pour chaque ligne. D\'abord choisissez la Nature, puis le Type correspondant.',
      designation: 'Décrivez clairement l\'article ou service (ex: "Fournitures de bureau", "Frais de transport").',
      quantite: 'Saisissez la quantité d\'articles ou d\'unités.',
      prixUnitaire: 'Saisissez le prix d\'un seul article ou unité en FCFA.',
      total: 'Le total est calculé automatiquement : Quantité × Prix unitaire.',
      nature: 'Sélectionnez d\'abord la nature comptable (classe du compte).',
      type: 'Sélectionnez ensuite le type de compte (compte spécifique). Les types dépendent de la nature choisie.',
    },
    compteComptableSelector: {
      title: 'Sélection de compte comptable',
      description: 'Choisissez le compte comptable approprié pour cette ligne.',
      recherche: 'Utilisez la recherche pour trouver rapidement un compte.',
    },
    soldeCard: {
      title: 'Solde de caisse',
      description: 'Affiche le solde actuel de votre caisse.',
      info: 'Le solde est mis à jour en temps réel après chaque opération.',
    },
    itemsTable: {
      title: 'Tableau des éléments',
      description: 'Liste des éléments avec possibilité de tri et de filtrage.',
    },
    journalTable: {
      title: 'Journal des opérations',
      description: 'Historique chronologique de toutes les opérations de caisse.',
    },
    auditTable: {
      title: 'Tableau d\'audit',
      description: 'Toutes les actions effectuées dans le système avec horodatage et utilisateur.',
    },
    signatureArea: {
      title: 'Zone de signature',
      description: 'Signez électroniquement en dessinant avec votre souris ou doigt.',
      clear: 'Cliquez sur "Effacer" pour recommencer votre signature.',
    },
    paymentTerminal: {
      title: 'Terminal de paiement',
      description: 'Interface simplifiée pour les opérations de paiement rapides.',
    },
    notificationWidget: {
      title: 'Notifications',
      description: 'Consultez vos notifications en temps réel.',
    },
    myRequestsWidget: {
      title: 'Mes demandes récentes',
      description: 'Aperçu rapide de vos dernières demandes avec leur statut.',
    },
  },

  // === ÉLÉMENTS SPÉCIFIQUES ===
  elements: {
    statut: {
      BROUILLON: 'La demande est en cours de rédaction et n\'a pas encore été soumise.',
      ATTENTE_CHEF: 'La demande attend la validation du chef de service.',
      ATTENTE_MANAGER: 'La demande a été validée par le chef et attend la validation du manager.',
      VALIDEE_A_PAYER: 'La demande est validée et peut être payée par la caisse.',
      PAYEE: 'La demande a été payée.',
      REFUSEE: 'La demande a été refusée. Consultez le motif de refus.',
    },
    typeDemande: {
      FICHE_BESOIN: 'Demande d\'achat de biens ou services.',
      ORDRE_MISSION: 'Demande liée à une mission professionnelle.',
      TRANSPORT: 'Demande de remboursement de frais de transport.',
      DIVERS: 'Autre type de demande.',
    },
    modePaiement: {
      description: 'Le mode de paiement indique comment l\'argent a été reçu ou payé.',
      especes: 'Paiement en espèces (billets et pièces).',
      cheque: 'Paiement par chèque.',
      virement: 'Paiement par virement bancaire.',
      carte: 'Paiement par carte bancaire.',
    },
    compteComptable: {
      description: 'Le compte comptable permet de classer les opérations pour la comptabilité.',
      selection: 'Sélectionnez le compte approprié selon la nature de la dépense.',
    },
    justificatif: {
      description: 'Le justificatif est un document prouvant la dépense (facture, reçu, etc.).',
      upload: 'Téléchargez un fichier PDF ou image du justificatif.',
      requis: 'Un justificatif est généralement requis pour les décaissements.',
    },
    billetage: {
      description: 'Le billetage consiste à compter les espèces dans la caisse.',
      frequence: 'Effectuez un billetage régulièrement pour vérifier l\'exactitude du solde.',
      ecart: 'En cas d\'écart, signalez-le immédiatement à votre responsable.',
    },
    transfert: {
      description: 'Un transfert permet de déplacer de l\'argent d\'une caisse à une autre.',
      motif: 'Indiquez toujours un motif clair pour le transfert.',
      validation: 'Les transferts peuvent nécessiter une validation selon les montants.',
    },
  },

  // === ADMINISTRATION ===
  admin: {
    users: {
      title: 'Gestion des utilisateurs',
      description: 'Créez, modifiez et gérez les comptes utilisateurs du système.',
      roles: 'Assignez les rôles appropriés à chaque utilisateur selon leurs responsabilités.',
    },
    roles: {
      title: 'Gestion des rôles',
      description: 'Configurez les rôles et leurs permissions dans le système.',
    },
    caisses: {
      title: 'Gestion des caisses',
      description: 'Créez et gérez les différentes caisses de l\'organisation.',
    },
    services: {
      title: 'Gestion des services',
      description: 'Organisez les services et départements de l\'entreprise.',
    },
    modesPaiement: {
      title: 'Gestion des modes de paiement',
      description: 'Configurez les modes de paiement disponibles dans le système.',
    },
    comptesComptables: {
      title: 'Gestion des comptes comptables',
      description: 'Maintenez le plan comptable utilisé pour la classification des opérations.',
    },
  },
};

/**
 * Fonction utilitaire pour récupérer un texte d'aide
 */
export const getHelpText = (path: string): string | undefined => {
  const keys = path.split('.');
  let current: any = helpContent;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
};

