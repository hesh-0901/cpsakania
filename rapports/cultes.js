// rapports/cultes.js - Logique de tableur condensée ERP
import { db } from "../config/app.js";
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const tablePc = document.getElementById('table-cultes-pc');
const listMobile = document.getElementById('list-cultes-mobile');

const q = query(collection(db, "activites"), orderBy("dateRencontre", "desc"));

onSnapshot(q, (snapshot) => {
    if (tablePc) tablePc.innerHTML = "";
    if (listMobile) listMobile.innerHTML = "";

    let aDesDonnees = false;

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Exclure ce qui relève uniquement de la caisse pure si nécessaire 
        // (Ici on prend tout ce qui possède un type de rencontre lié au culte)
        aDesDonnees = true;

        let dateFormatee = "—";
        if (data.dateRencontre) {
            const f = data.dateRencontre.split('-');
            if (f.length === 3) dateFormatee = `${f[2]}/${f[1]}/${f[0].slice(-2)}`;
        }

        const typeAffiche = data.type === 'Autres' ? data.typePrecise : data.type;

        // 1. Rendu PC (Une seule ligne stricte par culte)
        if (tablePc) {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-pine/20 cursor-pointer transition border-b border-pine/10 font-medium";
            tr.setAttribute('data-id', doc.id);
            tr.innerHTML = `
                <td class="py-2.5 px-4 text-mountain-meadow">${dateFormatee}</td>
                <td class="py-2.5 px-4 font-bold text-anti-flash-white truncate max-w-[150px]">${typeAffiche}</td>
                <td class="py-2.5 px-4 text-stone truncate max-w-[240px]">"${data.theme}"</td>
                <td class="py-2.5 px-4 text-mint truncate">${data.predicateur}</td>
                <td class="py-2.5 px-4 text-center text-anti-flash-white font-bold">${data.participants}</td>
                <td class="py-2.5 px-4 text-right text-caribbean-green font-semibold">${data.offrandes}</td>
            `;
            tablePc.appendChild(tr);
        }

        // 2. Rendu Mobile (Format une ligne compacte)
        if (listMobile) {
            const div = document.createElement('div');
            div.className = "p-3 hover:bg-pine/10 active:bg-pine/20 cursor-pointer flex items-center justify-between gap-2 transition";
            div.setAttribute('data-id', doc.id);
            div.innerHTML = `
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <span class="text-mountain-meadow font-semibold text-[11px]">${dateFormatee}</span>
                        <h4 class="font-bold text-anti-flash-white truncate text-xs">${typeAffiche}</h4>
                    </div>
                    <p class="text-stone truncate text-[11px] mt-0.5">"${data.theme}"</p>
                </div>
                <div class="text-right shrink-0">
                    <span class="block font-bold text-anti-flash-white text-[11px]">${data.participants} prés.</span>
                    <span class="block text-caribbean-green font-semibold text-[11px] mt-0.5">${data.offrandes}</span>
                </div>
            `;
            listMobile.appendChild(div);
        }
    });

    if (!aDesDonnees) {
        const videHTML = `<tr><td colspan="6" class="py-6 text-center text-stone">Aucun enregistrement trouvé.</td></tr>`;
        if (tablePc) tablePc.innerHTML = videHTML;
        if (listMobile) listMobile.innerHTML = `<div class="p-6 text-center text-stone">Aucun enregistrement.</div>`;
    }

    // Activer Lucide et les clics
    if (window.lucide) window.lucide.createIcons();
    attacherEvenementsClicERP();
});

function attacherEvenementsClicERP() {
    const lignes = document.querySelectorAll('[data-id]');
    lignes.forEach(ligne => {
        ligne.addEventListener('click', () => {
            const id = ligne.getAttribute('data-id');
            if (id) {
                // On remonte d'un niveau pour ouvrir le formulaire
                window.location.href = `../formulaires/activite.html?id=${id}`;
            }
        });
    });
}
