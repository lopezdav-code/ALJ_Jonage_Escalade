// Diagnostic script pour identifier les éléments bloquant les clics
// À exécuter dans la console de la page competitions/participants/

(function debugClickBlocker() {
    console.clear();
    console.log('🔍 === DIAGNOSTIC DES CLICS BLOQUÉS ===\n');

    // 1. Trouver tous les boutons de suppression
    const deleteButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        return btn.textContent.includes('Supprimer') ||
            btn.title?.includes('Supprimer') ||
            btn.querySelector('svg');
    });

    console.log(`📊 Trouvé ${deleteButtons.length} boutons potentiels\n`);

    if (deleteButtons.length === 0) {
        console.error('❌ Aucun bouton trouvé!');
        return;
    }

    // 2. Analyser le premier bouton
    const button = deleteButtons[0];
    const rect = button.getBoundingClientRect();

    console.log('🎯 Position du bouton:');
    console.log(`   Top: ${rect.top}px, Left: ${rect.left}px`);
    console.log(`   Width: ${rect.width}px, Height: ${rect.height}px\n`);

    // 3. Styles du bouton
    const btnStyles = window.getComputedStyle(button);
    console.log('🎨 Styles du bouton:');
    console.log(`   z-index: ${btnStyles.zIndex}`);
    console.log(`   pointer-events: ${btnStyles.pointerEvents}`);
    console.log(`   opacity: ${btnStyles.opacity}`);
    console.log(`   display: ${btnStyles.display}`);
    console.log(`   visibility: ${btnStyles.visibility}\n`);

    // 4. Trouver tous les éléments au centre du bouton
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    console.log(`🔎 Éléments au point (${Math.round(centerX)}, ${Math.round(centerY)}):\n`);

    const elementsAtPoint = document.elementsFromPoint(centerX, centerY);

    elementsAtPoint.forEach((el, i) => {
        const styles = window.getComputedStyle(el);
        const tag = el.tagName.toLowerCase();
        const classes = el.className || '(no class)';

        console.log(`[${i}] <${tag}> ${classes}`);
        console.log(`    z-index: ${styles.zIndex}`);
        console.log(`    pointer-events: ${styles.pointerEvents}`);
        console.log(`    position: ${styles.position}`);
        console.log(`    opacity: ${styles.opacity}`);

        // Vérifier si cet élément bloque
        if (el !== button &&
            styles.pointerEvents !== 'none' &&
            parseFloat(styles.opacity) > 0) {
            console.log(`    ⚠️  PEUT BLOQUER LES CLICS!`);
        }
        console.log('');
    });

    // 5. Vérifier les overlays de dialog
    console.log('🔍 Recherche d\'overlays de dialog...\n');
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-state]');

    overlays.forEach((overlay, i) => {
        const styles = window.getComputedStyle(overlay);
        const state = overlay.getAttribute('data-state');

        console.log(`[${i}] Overlay (state: ${state})`);
        console.log(`    display: ${styles.display}`);
        console.log(`    pointer-events: ${styles.pointerEvents}`);
        console.log(`    z-index: ${styles.zIndex}`);
        console.log(`    opacity: ${styles.opacity}`);

        if (styles.display !== 'none' && styles.pointerEvents !== 'none') {
            console.log(`    ⚠️  OVERLAY ACTIF - PEUT BLOQUER!`);
        }
        console.log('');
    });

    // 6. Test de clic programmatique
    console.log('🧪 Test de clic programmatique...\n');

    let clickReceived = false;
    const testHandler = () => {
        clickReceived = true;
        console.log('✅ Le bouton a reçu l\'événement click!');
    };

    button.addEventListener('click', testHandler, { once: true });
    button.click();

    setTimeout(() => {
        if (!clickReceived) {
            console.error('❌ Le bouton n\'a PAS reçu l\'événement click!');
            console.log('💡 Le problème est probablement un élément qui intercepte les clics');
        }
        button.removeEventListener('click', testHandler);
    }, 100);

    // 7. Recommandations
    console.log('\n💡 RECOMMANDATIONS:\n');
    console.log('1. Vérifiez les éléments marqués ⚠️  ci-dessus');
    console.log('2. Les overlays avec pointer-events !== "none" bloquent les clics');
    console.log('3. Les éléments avec z-index > celui du bouton peuvent bloquer');
    console.log('4. Si le clic programmatique échoue, c\'est un problème JavaScript\n');

    console.log('✅ Diagnostic terminé!\n');
    console.log('📋 Copiez ces résultats et envoyez-les pour analyse.');
})();
