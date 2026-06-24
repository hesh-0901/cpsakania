// rapports/caisse.js - Gestion financière centralisée ERP
import { db } from "../config/app.js";
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const formCaisse = document.getElementById('form-caisse');
const tableBody = document.getElementById('table-caisse-body');
const txtSoldeFC = document.getElementById('solde-fc');
const txtSoldeUSD = document.getElementById('solde-usd');

let toutLeJournal = [];
let fluxActivites = [];
let fluxManuels = [];

// Saisie manuelle d'une opération de caisse
if (formCaisse) {
    formCaisse.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = formCaisse.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;

        const dateMouvement = document.getElementById('caisse-date').value;
        const typeFlux = document.getElementById('caisse-flux').value;
        const libelle = document.getElementById('caisse-libelle').value;
        const montant = parseFloat(document.getElementById('caisse-montant').value) || 0;
        const devise = document.getElementById('caisse-devise').value;

        try {
            await addDoc(collection(db, "caisse_operations"), {
                date: dateMouvement,
                type: typeFlux,
                libelle: libelle,
                montant: montant,
                devise: devise,
                dateCreation: serverTimestamp()
            });

            formCaisse.reset();
            alert("Mouvement financier enregistré !");
        } catch (err) {
            console.error("Erreur lors de la sauvegarde financière :", err);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            btnSubmit.disabled = false;
        }
    });
}

// Extraction propre et découpage des chaînes d'offrandes (Ex: "45000 FC" ou "20 $")
function analyserOffrande(chaineOffrande) {
    if (!chaineOffrande) return { montant: 0, devise: 'FC' };
    
    const nettoye = chaineOffrande.toUpperCase().replace(/\s+/g, '');
    const montant = parseFloat(nettoye.replace(/[^0-9.]/g, '')) || 0;
    
    let devise = 'FC';
    if (nettoye.includes('$') || nettoye.includes('USD') || nettoye.includes('DOL')) {
        devise = 'USD';
    }
    
    return { montant, devise };
}

// Écouteur 1 : Les activités (pour récupérer les offrandes des cultes automatiquement)
const qActivites = query(collection(db, "activites"), orderBy("dateRencontre", "desc"));
onSnapshot(qActivites, (snapshot) => {
    fluxActivites = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.offrandes) {
            const analyse = analyserOffrande(data.offrandes);
            if (analyse.montant > 0) {
                const typeAffiche = data.type === 'Autres' ? data.typePrecise : data.type;
                fluxActivites.push({
                    id: doc.id,
                    date: data.dateRencontre,
                    libelle: `Offrandes — ${typeAffiche}`,
                    type: "Entrée",
                    montant: analyse.montant,
                    devise: analyse.devise
                });
            }
        }
    });
    fusionnerEtCalculer();
});

// Écouteur 2 : Les opérations manuelles (Entrées/Sorties de caisse courante)
const qCaisse = query(collection(db, "caisse_operations"), orderBy("date", "desc"));
onSnapshot(qCaisse, (snapshot) => {
    fluxManuels = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        fluxManuels.push({
            id: doc.id,
            date: data.date,
            libelle: data.libelle,
            type: data.type,
            montant: data.montant,
            devise: data.devise
        });
    });
    fusionnerEtCalculer();
});

// Fusion des deux canaux de flux, tri par date et calcul mathématique des deux caisses
function fusionnerEtCalculer() {
    toutLeJournal = [...fluxActivites, ...fluxManuels];
    
    // Tri décroissant par date
    toutLeJournal.sort((a, b) => new Date(b.date) - new Date(a.date));

    let soldeFC = 0;
    let soldeUSD = 0;

    if (tableBody) tableBody.innerHTML = "";

    toutLeJournal.forEach((op) => {
        // Logique de calcul des soldes cumulés
        if (op.devise === "FC") {
            if (op.type === "Entrée") soldeFC += op.montant;
            else soldeFC -= op.montant;
        } else {
            if (op.type === "Entrée") soldeUSD += op.montant;
            else soldeUSD -= op.montant;
        }

        // Formatage de la date en JJ/MM/AA
        let dateFormatee = op.date;
        if (op.date && op.date.includes('-')) {
            const f = op.date.split('-');
            if (f.length === 3) dateFormatee = `${f[2]}/${f[1]}/${f[0].slice(-2)}`;
        }

        // Rendu ERP de la ligne
        if (tableBody) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-pine/10 transition border-b border-pine/10 font-medium";
            
            const badgeCouleur = op.type === "Entrée" ? "bg-caribbean-green/10 text-caribbean-green border-caribbean-green/20" : "bg-red-500/10 text-red-400 border-red-500/20";
            const montantCouleur = op.type === "Entrée" ? "text-anti-flash-white" : "text-stone line-through decoration-red-500/30";
            const prefixeSigne = op.type === "Entrée" ? "+" : "-";

            tr.innerHTML = `
                <td class="py-2.5 px-4 text-stone">${dateFormatee}</td>
                <td class="py-2.5 px-4 font-bold text-anti-flash-white truncate max-w-[200px]">${op.libelle}</td>
                <td class="py-2.5 px-4 text-center">
                    <span class="px-2 py-0.5 border rounded-full text-[10px] font-bold ${badgeCouleur}">${op.type}</span>
                </td>
                <td class="py-2.5 px-4 text-right font-mono font-bold ${montantCouleur}">
                    ${prefixeSigne} ${op.montant.toLocaleString('fr-FR')} ${op.devise === 'USD' ? '$' : 'FC'}
                </td>
            `;
            tableBody.appendChild(tr);
        }
    });

    // Mise à jour de l'affichage des totaux
    if (txtSoldeFC) txtSoldeFC.innerText = `${soldeFC.toLocaleString('fr-FR')} FC`;
    if (txtSoldeUSD) txtSoldeUSD.innerText = `${soldeUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

    if (toutLeJournal.length === 0 && tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-stone">Aucun mouvement en caisse référencé.</td></tr>`;
    }
}
