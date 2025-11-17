/* ==========================================================================
   JS : Q5 selon OS + validation inline custom + modal personnalisée
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quiz-form');
  if (!form) return;

  const osSelect   = document.getElementById('os');
  const q5Windows  = document.getElementById('q5-windows');
  const q5Mac      = document.getElementById('q5-macos');
  const q5Linux    = document.getElementById('q5-linux');

  // Modal
  const modal   = document.getElementById('confirm-modal');
  const modalYes= document.getElementById('modal-yes');
  const modalNo = document.getElementById('modal-no');

  /* ---------- Affichage Q5 selon OS ---------- */
  function showQ5ForOS(value) {
    [q5Windows, q5Mac, q5Linux].forEach(b => { if (b) b.setAttribute('hidden',''); });
    if (value === 'windows' && q5Windows) q5Windows.removeAttribute('hidden');
    if (value === 'macos'   && q5Mac)     q5Mac.removeAttribute('hidden');
    if (value === 'linux'   && q5Linux)   q5Linux.removeAttribute('hidden');
  }
  if (osSelect) {
    osSelect.addEventListener('change', e => showQ5ForOS(e.target.value));
    showQ5ForOS(osSelect.value);
  }

  /* ---------- Helpers erreurs inline ---------- */
  function ensureErrorEl(container){
    let err = container.querySelector('.error-msg');
    if (!err) {
      err = document.createElement('div');
      err.className = 'error-msg';
      container.appendChild(err);
    }
    return err;
  }
  function setError(container, msg){
    container.classList.add('invalid');
    container.classList.remove('valid');
    const err = ensureErrorEl(container);
    err.textContent = msg;
    const input = container.querySelector('input, select, textarea, fieldset');
    if (input) input.setAttribute('aria-invalid','true');
  }
  function clearError(container){
    container.classList.remove('invalid');
    container.classList.remove('valid');
    const err = container.querySelector('.error-msg');
    if (err) err.textContent = '';
    const input = container.querySelector('input, select, textarea, fieldset');
    if (input) input.removeAttribute('aria-invalid');
  }
  function markValid(container){
    container.classList.remove('invalid');
    container.classList.add('valid');
    const err = container.querySelector('.error-msg');
    if (err) err.textContent = '';
    const input = container.querySelector('input, select, textarea, fieldset');
    if (input) input.removeAttribute('aria-invalid');
  }

  /* ---------- Validation du formulaire (inline) ---------- */
  function validateForm(){
    let ok = true;

    // 1) Nom (>= 2 caractères)
    const nomInput = document.getElementById('nom');
    const nomField = nomInput.closest('.field');
    const nom = (nomInput.value || '').trim();
    if (nom.length < 2){
      setError(nomField, 'Veuillez renseigner votre nom (au moins 2 caractères).');
      ok = false;
    } else {
      markValid(nomField);
    }

    // 2) OS requis
    const osField = osSelect.closest('.field');
    if (!osSelect.value){
      setError(osField, 'Sélectionnez votre système (Windows, macOS ou Linux).');
      ok = false;
    } else {
      markValid(osField);
    }

    // 3) Q1..Q4 radios requis
    function checkRadio(groupName, qBlockId, label){
      const group = form.querySelector(`input[name="${groupName}"]:checked`);
      const block = document.getElementById(qBlockId);
      if (!group){
        setError(block, `Veuillez répondre à ${label}.`);
        ok = false;
      } else {
        markValid(block);
      }
    }
    checkRadio('q1','q-block-q1','la question 1');
    checkRadio('q2','q-block-q2','la question 2');
    checkRadio('q3','q-block-q3','la question 3');
    checkRadio('q4','q-block-q4','la question 4');

    // 4) Q5 : dépend de l’OS (mais le name="q5" est unique)
    const q5Checked = form.querySelector('input[name="q5"]:checked');
    // Choisir le bon conteneur visuel selon l’OS affiché
    let q5Container = null;
    if (osSelect.value === 'windows') q5Container = q5Windows;
    if (osSelect.value === 'macos')   q5Container = q5Mac;
    if (osSelect.value === 'linux')   q5Container = q5Linux;

    if (!q5Checked){
      if (q5Container) setError(q5Container, 'Veuillez répondre à la question 5.');
      ok = false;
    } else {
      if (q5Container) markValid(q5Container);
    }

    // scroll au 1er invalid pour confort
    if (!ok){
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior:'smooth', block:'center' });
    }
    return ok;
  }

  // Ajoute des id aux q-block pour la validation (si pas déjà là)
  // (évite d’éditer ton HTML)
  const qBlocks = form.querySelectorAll('.q-block');
  qBlocks.forEach((b, i) => {
    if (!b.id) b.id = `q-block-q${i+1}`;
  });

  // Clear error à la saisie
  form.addEventListener('input', (e) => {
    const wrapper = e.target.closest('.field, .q-block');
    if (wrapper) clearError(wrapper);
  });
  form.addEventListener('change', (e) => {
    const wrapper = e.target.closest('.field, .q-block');
    if (wrapper) clearError(wrapper);
  });

  /* ---------- Modal personnalisée ---------- */
  function openModal(){
    if (!modal) return;
    modal.removeAttribute('hidden');
    document.body.classList.add('below-modal');
    if (document.getElementById('modal-yes')) document.getElementById('modal-yes').focus();
  }
  function closeModal(){
    if (!modal) return;
    modal.setAttribute('hidden','');
    document.body.classList.remove('below-modal');
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.focus();
  }

  let bypassConfirm = false;

  form.addEventListener('submit', (e) => {
    if (bypassConfirm) return; // laisse passer après clic "Oui"

    e.preventDefault(); // on gère tout
    const ok = validateForm();
    if (!ok) return;     // erreurs inline affichées

    // valid -> modal
    openModal();
  });

  // Boutons modal
  document.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t && t.id === 'modal-yes'){
      bypassConfirm = true;
      closeModal();
      form.submit(); // soumission réelle
    }
    if (t && t.id === 'modal-no'){
      closeModal();
    }
    if (t && t === modal){ // clic sur le fond
      closeModal();
    }
  });
  // ESC pour fermer
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && modal && !modal.hasAttribute('hidden')){
      closeModal();
    }
  });
});
