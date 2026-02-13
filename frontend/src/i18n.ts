import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector'; // detect language

// --- TRADUCTIONS INTÉGRÉES (Plus sûr) ---
const resources: any = {
  fr: {
    translation: {
      "common": {
        "action": "Action",
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
        "type": "Type",
        "titre": "Titre",
        "date": "Date",
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
        "admin": {
          "title": "Administration",
          "subtitle": "Configuration globale du système. Certaines actions sensibles sont enregistrées dans l'audit.",
          "tabs": {
            "soc": "Société",
            "users": "Personnel",
            "structure": "Services",
            "caisse": "Caisses",
            "compta": "Plan Comptable",
            "modes": "Modes Paiement","roles": "Rôles Personnalisés"
          }
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
            "VALIDEE_A_PAYER": "À Payer (Caisse)",
            "PAYEE": "Payée",
            "REFUSEE": "Refusée",
            "BROUILLON": "Brouillon"
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
          "title": "Demander des Fonds",
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
          "save_draft": "Enregistrer le brouillon",
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
        "chefValidation": {
          "title": "Validation des demandes (Service)",
          "empty_title": "Tout est à jour !",
          "empty_sub": "Aucune demande en attente de validation pour votre service.",
          "view_request": "Voir le bon",
          "validate_button": "Valider",
          "refuse_button": "Refuser",
          "modal_validate": "Valider la demande",
          "confirm_title": "Confirmation",
          "confirm_text": "Voulez-vous vraiment {{action}} cette demande ?",
          "actions": {
            "valider": "valider",
            "refuser": "refuser"
          },
          "load_error": "Impossible de charger le détail",
          "load_error_title": "Erreur",
          "action_success": "Action effectuée avec succès.",
          "action_error": "Impossible d'exécuter l'action"
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
        "caisseHistory": {
          "back": "Retour Caisse",
          "title": "Mes Opérations",
          "filters": {
            "type": "Type",
            "all": "Tout",
            "entry": "Entrées (+)",
            "exit": "Sorties (-)"
          },
          "table": {
            "headers": {
              "hour": "Heure",
              "type": "Type",
              "reason": "Motif",
              "amount": "Montant",
              "actions": "Actions"
            }
          },
          "type": {
            "entry": "ENTRÉE",
            "exit": "SORTIE"
          },
          "view_details": "Voir détails",
          "print_receipt": "Imprimer Bon de Caisse",
          "page": "Page {{current}}"
        },
        "audit": {
          "title": "Journal d'Audit & Sécurité",
          "refresh": "Actualiser",
          "search_placeholder": "Rechercher par acteur, action ou cible...",
          "date_ip": "Date & IP",
          "actor": "Acteur",
          "action": "Action",
          "target": "Cible",
          "loading": "Chargement des données de sécurité...",
          "empty": "Aucun événement trouvé.",
          "details_title": "Détails des modifications",
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
          "title": "Espace en construction",
          "hello": "Bonjour",
          "dev_for": "Votre tableau de bord ({{roles}}) est en cours de développement.",
          "logout": "Se déconnecter"
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
        },
        "dashboardCaissier": {
          "title": "Espace Caisse",
          "no_cash": { "title": "Aucune caisse assignée", "sub": "Contactez votre manager pour qu'il vous attribue un poste." },
          "state": { "label": "État", "closed": "FERMÉE", "ready_to_open": "Prête à l'ouverture" },
          "actions": { "open_session": "OUVRIR MA SESSION", "close_session": "Fermer la caisse", "encaisser": "ENCAISSER", "decaisser": "DÉCAISSER" },
          "open_title": "Ouverture de Caisse",
          "open_label": "Montant du fond de caisse initial",
          "open_placeholder": "Ex: 0 ou 5000",
          "open_confirm": "Ouvrir la session",
          "open_input_error": "Le montant doit être positif ou nul !",
          "open_error": "Impossible d'ouvrir la caisse",
          "open_network_error": "Erreur réseau lors de l'ouverture",
          "open_success_title": "Session Ouverte",
          "open_success_text": "Bonne journée de travail !",
          "cancel_recount": "Annuler, je recompte",
          "close_diff_title": "⚠️ ÉCART DE CAISSE DÉTECTÉ",
          "close_diff_html": "<div class=\"text-left bg-red-50 p-4 rounded-lg border border-red-200\"><p class=\"mb-2 text-gray-700\">Attention, le montant compté ne correspond pas au solde théorique du logiciel.</p><ul class=\"text-sm space-y-1\"><li>Solde Théorique : <strong>{{theorique}}</strong></li><li>Solde Physique : <strong>{{physique}}</strong></li><li class=\"text-red-600 font-bold text-lg mt-2 pt-2 border-t border-red-200\">Écart : {{ecart}}</li></ul><p class=\"mt-4 text-xs text-red-500 font-semibold uppercase\">Confirmer la fermeture enregistrera cet écart comptable.</p></div>",
          "close_ok_html": "<div class=\"text-center\"><p class=\"text-green-600 font-bold text-xl mb-2\">Aucun écart constaté ! ✅</p><p class=\"text-gray-600\">Solde de clôture : <strong>{{physique}}</strong></p><p class=\"text-sm text-gray-500 mt-4\">Voulez-vous terminer votre session ?</p></div>",
          "close_with_diff_confirm": "Oui, fermer avec écart",
          "close_confirm_title": "Confirmation de clôture",
          "close_confirm": "Oui, clôturer la caisse",
          "close_success_title": "Session Clôturée",
          "close_success_text": "La caisse est fermée.",
          "close_success_with_diff": "La caisse est fermée. Un écart de {{ecart}} a été enregistré.",
          "close_unknown_error": "Erreur inconnue lors de la fermeture",
          "close_blocked_title": "Clôture Bloquée",
          "close_blocked_html": "<p>Vous ne pouvez pas fermer la caisse.</p><p class=\"font-bold text-red-600 mt-2\">{{message}}</p><p class=\"text-sm mt-2\">Veuillez justifier les opérations en attente.</p>",
          "close_network_error": "Problème de connexion au serveur",
          "session_active": "SESSION ACTIVE",
          "poste": "Poste :",
          "close_placeholder": "Solde compté ?",
          "verify": "VÉRIFIER",
          "journal_title": "Journal de Session"
        },
        "dashboardChef": {
          "title": "Espace Chef de Service",
          "header": "Demandes en attente de validation",
          "empty": "Aucune demande en attente pour votre service.",
          "no_description": "Pas de description",
          "refuse_button": "Refuser",
          "validate_button": "Valider et envoyer au Manager",
          "confirm_title": "Confirmation",
          "confirm_text": "Voulez-vous vraiment {{action}} cette demande ?",
          "actions": { "valider": "valider", "refuser": "refuser" },
          "action_success": "Action effectuée avec succès.",
          "action_error": "Impossible d'exécuter l'action"
        },
        "dashboardEmploye": {
          "greeting": "Bonjour, {{name}}",
          "subtitle": "Bienvenue sur votre espace personnel. Que souhaitez-vous faire aujourd'hui ?",
          "actions": { "new_request": "Nouvelle Demande" },
          "recent_requests": "Vos demandes récentes",
          "view_all": "Voir tout",
          "validation_flow": {
            "title": "Circuit de validation",
            "step1": { "title": "Validation Chef de Service", "desc": "Votre responsable direct approuve le besoin." },
            "step2": { "title": "Validation Manager", "desc": "Contrôle final et autorisation de décaissement." },
            "step3": { "title": "Paiement Caisse", "desc": "Présentez-vous à la caisse avec votre numéro de demande." }
          },
          "help": { "title": "Besoin d'aide ?", "text": "Pour tout problème technique ou question sur une procédure, contactez le support IT.", "email": "support@entreprise.com" }
        },
        "dashboardManager": {
          "title": "Supervision Globale",
          "subtitle": "Vue d'ensemble de la trésorerie et des opérations en cours.",
          "kpi": { "state_label": "État Système", "operational": "Opérationnel" },
          "actions_title": "Actions & Gestion",
          "cards": {
            "validations": { "title": "Validations", "desc": "Traiter les demandes d'achats, ordres de mission et décaissements exceptionnels." },
            "history": { "title": "Historique Financier", "desc": "Consulter le journal global des mouvements et exporter les données comptables." },
            "admin": { "title": "Administration", "desc": "Gérer les utilisateurs, configurer les services et les caisses physiques." }
          }
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
        "action": "Action",
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
        "type": "Type",
        "titre": "Title",
        "date": "Date",
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
        "admin": {
          "title": "Administration",
          "subtitle": "Global system configuration. Sensitive actions are recorded in the audit.",
          "tabs": {
            "soc": "Company",
            "users": "Personnel",
            "structure": "Services",
            "caisse": "Cash Desks",
            "compta": "Chart of Accounts",
            "modes": "Payment Methods",
            "roles": "Custom Roles"
          }
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
            "VALIDEE_A_PAYER": "To pay (Cash)",
            "PAYEE": "Paid",
            "REFUSEE": "Rejected",
            "BROUILLON": "Draft"
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
          "title": "Request Funds",
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
          "save_draft": "Save draft",
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
        "chefValidation": {
          "title": "Request Validation (Service)",
          "empty_title": "All set!",
          "empty_sub": "No requests pending validation for your service.",
          "view_request": "View request",
          "validate_button": "Validate",
          "refuse_button": "Reject",
          "modal_validate": "Validate request",
          "confirm_title": "Confirmation",
          "confirm_text": "Do you really want to {{action}} this request?",
          "actions": {
            "valider": "validate",
            "refuser": "reject"
          },
          "load_error": "Unable to load details",
          "load_error_title": "Error",
          "action_success": "Action completed successfully.",
          "action_error": "Unable to perform the action"
        },
        "dashboardManager": {
          "title": "Global Supervision",
          "subtitle": "Overview of treasury and ongoing operations.",
          "kpi": { "state_label": "System Status", "operational": "Operational" },
          "actions_title": "Actions & Management",
          "cards": {
            "validations": { "title": "Validations", "desc": "Process purchase requests, mission orders and exceptional disbursements." },
            "history": { "title": "Financial History", "desc": "Review the global transactions log and export accounting data." },
            "admin": { "title": "Administration", "desc": "Manage users, configure services and physical cash desks." }
          }
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
        "caisseHistory": {
          "back": "Back to Cash",
          "title": "My Operations",
          "filters": {
            "type": "Type",
            "all": "All",
            "entry": "Entries (+)",
            "exit": "Exits (-)"
          },
          "table": {
            "headers": {
              "hour": "Hour",
              "type": "Type",
              "reason": "Reason",
              "amount": "Amount",
              "actions": "Actions"
            }
          },
          "type": {
            "entry": "IN",
            "exit": "OUT"
          },
          "view_details": "View details",
          "print_receipt": "Print receipt",
          "page": "Page {{current}}"
        },
        "audit": {
          "title": "Audit & Security Log",
          "refresh": "Refresh",
          "search_placeholder": "Search by actor, action or target...",
          "date_ip": "Date & IP",
          "actor": "Actor",
          "action": "Action",
          "target": "Target",
          "loading": "Loading security data...",
          "empty": "No events found.",
          "details_title": "Change details",
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
          "title": "Area under construction",
          "hello": "Hello",
          "dev_for": "Your dashboard ({{roles}}) is under development.",
          "logout": "Sign out"
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
        },
        "dashboardCaissier": {
          "title": "Cash Station",
          "no_cash": { "title": "No cash assigned", "sub": "Please contact your manager to assign you a station." },
          "state": { "label": "State", "closed": "CLOSED", "ready_to_open": "Ready to open" },
          "actions": { "open_session": "OPEN MY SESSION", "close_session": "Close cash", "encaisser": "CASH IN", "decaisser": "CASH OUT" },

          "open_title": "Open Cash",
          "open_label": "Initial cash fund amount",
          "open_placeholder": "Ex: 0 or 5000",
          "open_confirm": "Open session",
          "open_input_error": "Amount must be positive or zero!",
          "open_error": "Unable to open cash",
          "open_network_error": "Network error while opening",
          "open_success_title": "Session Opened",
          "open_success_text": "Have a good day at work!",
          "cancel_recount": "Cancel, I will recount",
          "close_diff_title": "⚠️ DIFFERENCE DETECTED",
          "close_diff_html": "<div class=\"text-left bg-red-50 p-4 rounded-lg border border-red-200\"><p class=\"mb-2 text-gray-700\">Attention, the counted amount does not match the system's theoretical balance.</p><ul class=\"text-sm space-y-1\"><li>Theoretical balance: <strong>{{theorique}}</strong></li><li>Physical balance: <strong>{{physique}}</strong></li><li class=\"text-red-600 font-bold text-lg mt-2 pt-2 border-t border-red-200\">Difference: {{ecart}}</li></ul><p class=\"mt-4 text-xs text-red-500 font-semibold uppercase\">Confirming closure will record this accounting difference.</p></div>",
          "close_ok_html": "<div class=\"text-center\"><p class=\"text-green-600 font-bold text-xl mb-2\">No difference detected! ✅</p><p class=\"text-gray-600\">Closing balance: <strong>{{physique}}</strong></p><p class=\"text-sm text-gray-500 mt-4\">Do you want to finish your session?</p></div>",
          "close_with_diff_confirm": "Yes, close with difference",
          "close_confirm_title": "Close confirmation",
          "close_confirm": "Yes, close the cash",
          "close_success_title": "Session Closed",
          "close_success_text": "The cash has been closed.",
          "close_success_with_diff": "The cash has been closed. A difference of {{ecart}} has been recorded.",
          "close_unknown_error": "Unknown error while closing",
          "close_blocked_title": "Closure Blocked",
          "close_blocked_html": "<p>You cannot close the cash.</p><p class=\"font-bold text-red-600 mt-2\">{{message}}</p><p class=\"text-sm mt-2\">Please justify pending operations.</p>",
          "close_network_error": "Server connection issue",
          "session_active": "ACTIVE SESSION",
          "poste": "Station:",
          "close_placeholder": "Counted balance?",
          "verify": "VERIFY",
          "journal_title": "Session Journal"
        },
        "dashboardEmploye": {
          "greeting": "Hello, {{name}}",
          "subtitle": "Welcome to your personal space. What would you like to do today?",
          "actions": { "new_request": "New Request" },
          "recent_requests": "Your recent requests",
          "view_all": "View all",
          "validation_flow": {
            "title": "Validation flow",
            "step1": { "title": "Service Manager Validation", "desc": "Your direct manager approves the need." },
            "step2": { "title": "Manager Validation", "desc": "Final check and disbursement authorization." },
            "step3": { "title": "Cash Payment", "desc": "Present yourself to the cash desk with your request number." }
          },
          "help": { "title": "Need help?", "text": "For technical issues or questions about a procedure, contact IT support.", "email": "support@company.com" }
        },
        "dashboardChef": {
          "title": "Service Manager Area",
          "header": "Requests awaiting validation",
          "empty": "No requests pending for your service.",
          "no_description": "No description",
          "refuse_button": "Reject",
          "validate_button": "Validate and send to Manager",
          "confirm_title": "Confirmation",
          "confirm_text": "Do you really want to {{action}} this request?",
          "actions": { "valider": "validate", "refuser": "reject" },
          "action_success": "Action completed successfully.",
          "action_error": "Unable to perform the action"
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
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: false,
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

export default i18n;