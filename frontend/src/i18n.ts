import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// --- TRADUCTIONS INTÉGRÉES (Plus sûr) ---
const resources = {
  fr: {
    translation: {
      "common": {
        "loading": "Chargement...",
        "error": "Une erreur est survenue",
        "save": "Enregistrer",
        "saving": "Enregistrement...",
        "cancel": "Annuler",
        "validate": "Valider",
        "refuse": "Refuser",
        "confirm": "Confirmer",
        "ok": "OK",
        "yes": "Oui",
        "no": "Non",
        "currency": "FCFA"
      },
      "menu": {
        "dashboard": "Tableau de bord",
        "requests": "Demandes",
        "validations": "Validations",
        "history": "Historique",
        "profile": "Mon Profil",
        "logout": "Déconnexion"
      },
      "manager": {
        "validation_title": "Centre de Validation",
        "validation_subtitle": "Gérez les demandes et opérations en attente de validation.",
        "refresh": "Actualiser",
        "demandes_rh": "Demandes RH",
        "operations_caisse": "Opérations Caisse",
        "aucune_demande": "Aucune demande RH en attente.",
        "aucune_operation": "Aucune opération de caisse en attente.",
        "demandeur": "Demandeur",
        "motif": "Motif",
        "montant": "Montant",
        "valider": "Valider",
        "refuser": "Refuser",
        "caissier": "Caissier",
        "service": "Service",
        "justificatif": "Justificatif",
        "payer": "Payer",
        "confirmation_demande": "Confirmer l'action \"{{action}}\" sur cette demande ?",
        "confirmation_validation": "Attention : Valider ce décaissement déduira immédiatement le montant du solde de la caisse.",
        "confirmation_refus": "Refuser cette opération l'annulera définitivement.",
        "erreur_operation": "Erreur: Impossible de traiter l'opération",
        "tabs": {
          "rh": "Demandes RH",
          "caisse": "Opérations Caisse"
        }
      },
      "pages": {
        "landing": {
          "tagline": "réinventée pour vous.",
          "features_title": "Tout ce dont vous avez besoin",
          "features_sub": "Une suite d'outils complète pour chaque rôle de l'entreprise.",
          "security_title": "Sécurité Bancaire",
          "copyright": "© 2025 Tous droits réservés.",
          "legal": "Mentions légales",
          "privacy": "Politique de confidentialité"
        },
        "login": {
          "title": "ORBIS CAISSE",
          "subtitle": "Accès sécurisé",
          "username": "Identifiant",
          "password": "Mot de passe",
          "forgot": "Mot de passe oublié ?",
          "signin": "Se connecter"
        },
        "home": {
          "new_request": "Nouvelle Demande",
          "new_request_sub": "Créer un bon de caisse ou une fiche de besoin.",
          "my_requests": "Mes Demandes",
          "my_requests_sub": "Suivre l'état de mes demandes en cours.",
          "my_cash": "Ma Caisse",
          "my_cash_sub": "Accéder à la station de travail pour encaisser/décaisser.",
          "journal": "Journal",
          "journal_sub": "Voir l'historique de mes opérations.",
          "validations": "Validations",
          "validations_sub": "Demandes de l'équipe en attente.",
          "team": "Mon Équipe",
          "team_sub": "Gérer les membres du service.",
          "supervision": "Supervision Live",
          "supervision_sub": "État des caisses en temps réel.",
          "finance": "Finance",
          "finance_sub": "Historique global et comptabilité.",
          "admin": "Admin",
          "admin_sub": "Paramétrage système."
        },
        "requests": {
          "title": "Mes Demandes",
          "subtitle": "Suivez l'état de vos bons de caisse et ordres de mission.",
          "empty_title": "Aucune demande",
          "empty_sub": "Vous n'avez pas encore créé de demande de fonds.",
          "create_first": "Créer ma première demande",
          "new_button": "Nouvelle Demande",
          "search_placeholder": "Rechercher par n° ou titre...",
          "filters": "Filtres",
          "status": {
            "ATTENTE_CHEF": "Validation Chef",
            "ATTENTE_MANAGER": "Validation Manager",
            "VALIDEE_A_PAYER": "À Payer (Caisse)"
          },
          "table": {
            "reference": "Référence",
            "title": "Titre / Objet",
            "date": "Date",
            "amount": "Montant",
            "status": "Statut",
            "action": "Action"
          }
        },
        "workstation": {
          "no_cash_assigned": "Aucune caisse assignée",
          "contact_manager": "Contactez votre manager.",
          "session_inactive": "Session inactive",
          "session_active": "Session Active",
          "open_session": "OUVRIR MA SESSION",
          "close_cash": "Fermer la Caisse",
          "pending_funds": "Fonds en attente",
          "from": "De",
          "accept": "ACCEPTER",
          "accept_confirm": "Oui, accepter",
          "receive_title": "Réception de Fonds",
          "receive_confirm_text": "Confirmez-vous avoir physiquement reçu cet argent ?",
          "funds_added": "Fonds ajoutés à la caisse !",
          "reject": "REFUSER",
          "reject_transfer_title": "Refuser le transfert",
          "reject_input_label": "Motif du refus",
          "reject_placeholder": "Ex: Erreur de montant, Destinataire incorrect...",
          "reject_confirm": "Refuser et Renvoyer",
          "rejected_success_title": "Refusé",
          "rejected_success_sub": "Les fonds ont été renvoyés à l'expéditeur.",
          "transfert_error": "Impossible de rejeter le transfert.",
          "encaisser": "ENCAISSER",
          "decaisser": "DÉCAISSER",
          "transfer": "TRANSFÉRER",
          "quick_operation": "Opération Rapide",
          "details_session": "Détails Session",
          "opening": "Ouverture",
          "open_confirm_html": "Il reste <b>{{solde}} {{currency}}</b> en caisse.",
          "reprise_title": "Reprise de Caisse",
          "opening_title": "Ouverture de Caisse",
          "open_confirm_yes": "Oui, ouvrir",
          "network_error": "Erreur réseau",
          "cash_opened": "Caisse Ouverte",
          "cash_closed_success": "Caisse fermée avec succès.",
          "difference_alert_title": "⚠️ ÉCART DÉTECTÉ",
          "confirm_closure": "Confirmer la clôture",
          "close_confirm": "Clôturer définitivement",
          "recount": "Recompter",
          "transfer_sent": "Transfert envoyé !",
          "theoretical_balance": "Solde Théorique",
          "counted_balance": "Solde Compté",
          "difference": "Écart",
          "initial_fund": "Fond Initial",
          "session_id": "ID Session"
        },
        "profile": {
          "title": "Mon Profil",
          "section_security": "Sécurité du compte",
          "current_password": "Mot de passe actuel",
          "new_password": "Nouveau mot de passe",
          "confirm_new_password": "Confirmer le nouveau mot de passe",
          "passwords_mismatch": "Les mots de passe ne correspondent pas",
          "update_success": "Mot de passe mis à jour",
          "update_error": "Erreur lors de la mise à jour",
          "server_error": "Erreur serveur",
          "update_button": "Mettre à jour",
          "role_default": "EMPLOYÉ"
        },
        "newRequest": {
          "title": "Bon de Caisse",
          "subtitle": "Demande de Fonds",
          "back": "Annuler et Retour",
          "date": "Date",
          "issuer_label": "Émetteur (Vous)",
          "issuer_helper": "Personne connectée effectuant la saisie.",
          "beneficiary_label": "Bénéficiaire Réel",
          "beneficiary_me": "Moi-même",
          "mode_list": "LISTE",
          "mode_other": "AUTRE",
          "beneficiary_placeholder": "Nom & Prénoms du bénéficiaire...",
          "beneficiary_helper_list": "Sélectionnez un collègue disposant d'un compte.",
          "beneficiary_helper_manual": "Saisissez le nom si la personne n'a pas de compte (ex: externe).",
          "title_label": "Titre / Objet",
          "title_placeholder": "Ex: Achat fournitures bureau",
          "date_label": "Date",
          "type": "Type",
          "type_options": {
            "FICHE_BESOIN": "Fiche de Besoin",
            "ORDRE_MISSION": "Ordre de Mission",
            "TRANSPORT": "Transport",
            "DIVERS": "Divers"
          },
          "detailed_reason": "Motif Détaillé",
          "financial_details": "Détails financiers",
          "total_to_pay": "Total à Payer",
          "submit": "Soumettre",
          "submitting": "Envoi...",
          "save_button": "Enregistrer",
          "errors": {
            "amount_zero": "Le montant total ne peut pas être nul.",
            "create_error": "Impossible de créer la demande",
            "network_error": "Erreur réseau."
          }
        },
        "team": {
          "collaborator": "Collaborateur",
          "role": "Rôle",
          "status": "Statut",
          "new_member": "Nouveau Membre",
          "full_name": "Nom complet",
          "work_email": "Email professionnel",
          "cancel": "Annuler",
          "create_account": "Créer le compte"
        },
        "history": {
          "title": "Historique Complet",
          "subtitle": "Consultez, filtrez et exportez toutes les opérations.",
          "filters": {
            "type": "Type",
            "all": "Tous",
            "encaissement": "Encaissement (+)",
            "decaissement": "Décaissement (-)",
            "payment_mode": "Mode de paiement",
            "account": "Compte comptable",
            "cash": "Caisse",
            "from": "Du",
            "to": "Au"
          },
          "table": {
            "date": "Date",
            "type": "Type",
            "reason": "Motif",
            "mode": "Mode",
            "cashier": "Caissier",
            "amount": "Montant",
            "actions": "Actions"
          },
          "no_results": "Aucun résultat.",
          "page_info": "Page <strong>{{current}}</strong> sur <strong>{{total}}</strong> — {{items}} opérations"
        },
        "audit": {
          "date_ip": "Date & IP",
          "actor": "Acteur",
          "action": "Action",
          "target": "Cible",
          "loading": "Chargement des données de sécurité...",
          "empty": "Aucun événement trouvé.",
          "no_details": "Aucun détail technique disponible pour cette action (Création simple ou action système)."
        },
        "forceChangePassword": {
          "title": "Sécurité Requise",
          "new_password": "Nouveau mot de passe",
          "confirm_password": "Confirmer le mot de passe",
          "submit": "Définir et Accéder",
          "saving": "Enregistrement..."
        },
        "construction": {
          "title": "Espace en construction"
        },
        "dashboard": {
          "admin": "Compte Administrateur",
          "access_admin": "Veuillez accéder à la route /admin.",
          "logout": "Déconnexion",
          "access_denied": "Accès Refusé",
          "supervision": "Supervision Globale",
          "overview": "Vue d'ensemble de la trésorerie et des opérations en cours.",
          "system_status": "État Système",
          "operational": "Opérationnel",
          "actions_management": "Actions & Gestion",
          "validations": "Validations",
          "history_financial": "Historique Financier",
          "administration": "Administration",
          "welcome_private": "Bienvenue sur votre espace personnel. Que souhaitez-vous faire aujourd'hui ?"
        }
      },
      "components": {
        "table": {
          "loading": "Chargement...",
          "empty": "Aucun résultat.",
          "audit_loading": "Chargement de l'audit...",
          "no_logs": "Aucun log trouvé."
        },
        "modal": {
          "new_request": "Nouvelle Demande",
          "created_success": "Demande créée avec succès !",
          "created_sub": "Elle est maintenant en attente de validation."
        },
        "buttons": {
          "check": "VÉRIFIER",
          "accept": "Accepter",
          "reject": "Refuser",
          "close": "Fermer"
        },
        "fields": {
          "type": "Type",
          "title": "Titre / Objet",
          "amount": "Montant"
        }
      }
    }
  },
  en: {
    translation: {
      "common": {
        "loading": "Loading...",
        "error": "An error occurred",
        "save": "Save",
        "saving": "Saving...",
        "cancel": "Cancel",
        "validate": "Validate",
        "refuse": "Reject",
        "confirm": "Confirm",
        "ok": "OK",
        "yes": "Yes",
        "no": "No",
        "currency": "FCFA"
      },
      "menu": {
        "dashboard": "Dashboard",
        "requests": "Requests",
        "validations": "Validations",
        "history": "History",
        "profile": "My Profile",
        "logout": "Logout"
      },
      "manager": {
        "validation_title": "Validation Center",
        "validation_subtitle": "Manage requests and operations pending validation.",
        "refresh": "Refresh",
        "demandes_rh": "HR Requests",
        "operations_caisse": "Cash Operations",
        "aucune_demande": "No pending HR requests.",
        "aucune_operation": "No pending cash operations.",
        "demandeur": "Requester",
        "motif": "Reason",
        "montant": "Amount",
        "valider": "Validate",
        "refuser": "Reject",
        "caissier": "Cashier",
        "service": "Service",
        "justificatif": "Attachment",
        "payer": "Pay",
        "confirmation_demande": "Confirm \"{{action}}\" action on this request?",
        "confirmation_validation": "Warning: Validating this disbursement will immediately deduct the amount from the cash balance.",
        "confirmation_refus": "Rejecting this operation will cancel it permanently.",
        "erreur_operation": "Error: Unable to process the operation",
        "tabs": {
          "rh": "HR Requests",
          "caisse": "Cash Operations"
        }
      },
      "pages": {
        "landing": {
          "tagline": "reinvented for you.",
          "features_title": "Everything you need",
          "features_sub": "A full suite of tools for every company role.",
          "security_title": "Banking Security",
          "copyright": "© 2025 All rights reserved.",
          "legal": "Legal notice",
          "privacy": "Privacy policy"
        },
        "login": {
          "title": "ORBIS CAISSE",
          "subtitle": "Secure access",
          "username": "Username",
          "password": "Password",
          "forgot": "Forgot password?",
          "signin": "Sign in"
        },
        "home": {
          "new_request": "New Request",
          "new_request_sub": "Create a cash voucher or a requisition.",
          "my_requests": "My Requests",
          "my_requests_sub": "Track the status of your ongoing requests.",
          "my_cash": "My Cash",
          "my_cash_sub": "Access the workstation to cash in/out.",
          "journal": "Journal",
          "journal_sub": "View operation history.",
          "validations": "Validations",
          "validations_sub": "Team requests pending.",
          "team": "My Team",
          "team_sub": "Manage service members.",
          "supervision": "Live Supervision",
          "supervision_sub": "Real-time cash status.",
          "finance": "Finance",
          "finance_sub": "Global history and accounting.",
          "admin": "Admin",
          "admin_sub": "System settings."
        },
        "requests": {
          "title": "My Requests",
          "subtitle": "Track your cash vouchers and mission orders.",
          "empty_title": "No requests",
          "empty_sub": "You haven't created any cash request yet.",
          "create_first": "Create my first request",
          "new_button": "New Request",
          "search_placeholder": "Search by # or title...",
          "filters": "Filters",
          "status": {
            "ATTENTE_CHEF": "Chef validation",
            "ATTENTE_MANAGER": "Manager validation",
            "VALIDEE_A_PAYER": "To pay (Cash)"
          },
          "table": {
            "reference": "Reference",
            "title": "Title / Subject",
            "date": "Date",
            "amount": "Amount",
            "status": "Status",
            "action": "Action"
          }
        },
        "workstation": {
          "no_cash_assigned": "No cash assigned",
          "contact_manager": "Please contact your manager.",
          "session_inactive": "Session inactive",
          "session_active": "Active Session",
          "open_session": "OPEN MY SESSION",
          "close_cash": "Close Cash",
          "pending_funds": "Pending funds",
          "from": "From",
          "accept": "ACCEPT",
          "accept_confirm": "Yes, accept",
          "receive_title": "Receive funds",
          "receive_confirm_text": "Do you confirm you have physically received this money?",
          "funds_added": "Funds added to cash!",
          "reject": "REJECT",
          "reject_transfer_title": "Reject transfer",
          "reject_input_label": "Reason for rejection",
          "reject_placeholder": "E.g. Wrong amount, Incorrect recipient...",
          "reject_confirm": "Reject and Return",
          "rejected_success_title": "Rejected",
          "rejected_success_sub": "Funds have been returned to the sender.",
          "transfert_error": "Unable to reject the transfer.",
          "reject_input_required": "The reason is required for a rejection!",
          "encaisser": "CASH IN",
          "decaisser": "CASH OUT",
          "transfer": "TRANSFER",
          "quick_operation": "Quick Operation",
          "details_session": "Session Details",
          "opening": "Opening",
          "open_confirm_html": "There is <b>{{solde}} {{currency}}</b> left in cash.",
          "reprise_title": "Take over cash",
          "opening_title": "Open Cash",
          "open_confirm_yes": "Yes, open",
          "network_error": "Network error",
          "cash_opened": "Cash opened",
          "cash_closed_success": "Cash closed successfully.",
          "difference_alert_title": "⚠️ DIFFERENCE DETECTED",
          "confirm_closure": "Confirm closure",
          "close_confirm": "Close permanently",
          "recount": "Recount",
          "transfer_sent": "Transfer sent!",
          "theoretical_balance": "Theoretical balance",
          "counted_balance": "Counted balance",
          "difference": "Difference",
          "initial_fund": "Initial Fund",
          "session_id": "Session ID"
        },
        "profile": {
          "title": "My Profile",
          "section_security": "Account security",
          "current_password": "Current password",
          "new_password": "New password",
          "confirm_new_password": "Confirm new password",
          "passwords_mismatch": "Passwords do not match",
          "update_success": "Password updated",
          "update_error": "Error updating password",
          "server_error": "Server error",
          "update_button": "Update",
          "role_default": "EMPLOYEE"
        },
        "newRequest": {
          "title": "Cash Voucher",
          "subtitle": "Funds Request",
          "back": "Cancel and go back",
          "date": "Date",
          "issuer_label": "Issuer (You)",
          "issuer_helper": "Logged-in person filling the form.",
          "beneficiary_label": "Real beneficiary",
          "beneficiary_me": "Myself",
          "mode_list": "LIST",
          "mode_other": "OTHER",
          "beneficiary_placeholder": "Beneficiary full name...",
          "beneficiary_helper_list": "Select a colleague with an account.",
          "beneficiary_helper_manual": "Enter the name if the person has no account (e.g. external).",
          "title_label": "Title / Subject",
          "title_placeholder": "E.g. Office supplies purchase",
          "date_label": "Date",
          "type": "Type",
          "type_options": {
            "FICHE_BESOIN": "Requisition",
            "ORDRE_MISSION": "Mission Order",
            "TRANSPORT": "Transport",
            "DIVERS": "Misc"
          },
          "detailed_reason": "Detailed reason",
          "financial_details": "Financial details",
          "total_to_pay": "Total to pay",
          "submit": "Submit",
          "submitting": "Submitting...",
          "save_button": "Save",
          "errors": {
            "amount_zero": "Total amount cannot be zero.",
            "create_error": "Unable to create request",
            "network_error": "Network error."
          }
        },
        "team": {
          "collaborator": "Collaborator",
          "role": "Role",
          "status": "Status",
          "new_member": "New Member",
          "full_name": "Full name",
          "work_email": "Work email",
          "cancel": "Cancel",
          "create_account": "Create account"
        },
        "history": {
          "title": "Full History",
          "subtitle": "Browse, filter and export all operations.",
          "filters": {
            "type": "Type",
            "all": "All",
            "encaissement": "Inbound (+)",
            "decaissement": "Outbound (-)",
            "payment_mode": "Payment mode",
            "account": "Ledger account",
            "cash": "Cash",
            "from": "From",
            "to": "To"
          },
          "table": {
            "date": "Date",
            "type": "Type",
            "reason": "Reason",
            "mode": "Mode",
            "cashier": "Cashier",
            "amount": "Amount",
            "actions": "Actions"
          },
          "no_results": "No results.",
          "page_info": "Page <strong>{{current}}</strong> of <strong>{{total}}</strong> — {{items}} operations"
        },
        "audit": {
          "date_ip": "Date & IP",
          "actor": "Actor",
          "action": "Action",
          "target": "Target",
          "loading": "Loading security data...",
          "empty": "No events found.",
          "no_details": "No technical details available for this action (Simple creation or system action)."
        },
        "forceChangePassword": {
          "title": "Security Required",
          "new_password": "New password",
          "confirm_password": "Confirm password",
          "submit": "Set and Access",
          "saving": "Saving..."
        },
        "construction": {
          "title": "Area under construction"
        },
        "dashboard": {
          "admin": "Admin Account",
          "access_admin": "Please access /admin route.",
          "logout": "Logout",
          "access_denied": "Access Denied",
          "supervision": "Global Supervision",
          "overview": "Overview of treasury and ongoing operations.",
          "system_status": "System Status",
          "operational": "Operational",
          "actions_management": "Actions & Management",
          "validations": "Validations",
          "history_financial": "Financial History",
          "administration": "Administration",
          "welcome_private": "Welcome to your personal space. What would you like to do today?"
        }
      },
      "components": {
        "table": {
          "loading": "Loading...",
          "empty": "No results.",
          "audit_loading": "Loading audit...",
          "no_logs": "No logs found."
        },
        "modal": {
          "new_request": "New Request",
          "created_success": "Request created successfully!",
          "created_sub": "It is now pending validation."
        },
        "buttons": {
          "check": "CHECK",
          "accept": "Accept",
          "reject": "Reject",
          "close": "Close"
        },
        "fields": {
          "type": "Type",
          "title": "Title / Subject",
          "amount": "Amount"
        }
      }
    }
  }
};

i18n
  // Plus besoin de Backend ici
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources, // <--- ON CHARGE LES RESSOURCES DÉFINIES AU-DESSUS
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false, 
    },
    detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
    }
  });

export default i18n;