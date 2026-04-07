window.onload = async () => {
  await checarLogin();  // Atualiza o estado de login ao carregar
};




// -------------------- SUPABASE --------------------
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://vnclvuluqpgcbbrpzwqw.supabase.co',
  'sb_publishable_unHIUHkfh5ojHtX3fInLxA_JQPLAkG4'
);

// -------------------- LOAD PAGE --------------------
async function loadPage(url) {
  const contentDiv = document.getElementById('content');
  console.log("Tentando carregar:", url);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Arquivo não encontrado: " + url);

    const html = await response.text();
    contentDiv.innerHTML = html;
    checarLogin();
    
    // Atualiza links do topo após carregar
    const topo = document.getElementById('topo');
    const links = topo.querySelectorAll('a');
    links.forEach(link => link.classList.remove('current'));
    const mainLink = topo.querySelector(`a[data-link="${url}"]`);
    if (mainLink) mainLink.classList.add('current');
  } catch (error) {
    console.error(error);
    contentDiv.innerHTML = `<p style='color:red'>Erro ao carregar: ${url}. Verifique se o nome do arquivo está certo.</p>`;
  }
}

// -------------------- SPA LINKS --------------------
document.addEventListener("DOMContentLoaded", async () => {
  const topo = document.getElementById('topo');
  if (!topo) return console.error("ERRO: Não achei o id='topo'");

  // Carrega página inicial
  await loadPage('sobrenos.html');

  // Clique nos links do topo
  topo.addEventListener('click', async (e) => {
    const el = e.target;
    if (el.tagName === 'A' && el.dataset.link) {
      e.preventDefault();
      await loadPage(el.dataset.link);
    }
  });

  // Checa login inicial
  checarLogin();
});

// -------------------- LOGIN / LOGOUT --------------------
async function checarLogin() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  const loginA = document.getElementById("login-a");
  const userArea = document.getElementById("user-area");
  const userName = document.getElementById("user-name");

  // elementos do form
  const formArvore = document.getElementById('form-arvore');
  const msgLogin = document.getElementById('login-msg');

  // Header sempre atualiza
  if (session?.user) {
    loginA.style.display = "none";
    userArea.style.display = "block";
    userName.textContent = session.user.email;
  } else {
    loginA.style.display = "block";
    userArea.style.display = "none";
    userName.textContent = "";
  }

  // Só mexe no form se ele existir na página
  if (formArvore && msgLogin) {
    if (session?.user) {
      formArvore.style.display = 'block';
      msgLogin.style.display = 'none';
    } else {
      formArvore.style.display = 'none';
      msgLogin.style.display = 'block';
    }
  }

  // Atualiza automaticamente quando loga/desloga
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      loginA.style.display = "none";
      userArea.style.display = "block";
      userName.textContent = session.user.email;

      if (formArvore && msgLogin) {
        formArvore.style.display = 'block';
        msgLogin.style.display = 'none';
      }
    } else {
      loginA.style.display = "block";
      userArea.style.display = "none";
      userName.textContent = "";

      if (formArvore && msgLogin) {
        formArvore.style.display = 'none';
        msgLogin.style.display = 'block';
      }
    }
  });
}

// -------------------- SIGNUP --------------------
async function signup() {
  const checkbox = document.getElementById('termos');
  if (!checkbox.checked) { alert('Você precisa aceitar os termos!'); return; }

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) { alert(error.message); } 
  else { alert('Conta criada! Verifica o email 📩'); }

  console.log("DATA:", data, "ERROR:", error);
}

// -------------------- LOGIN --------------------
async function login() {
  const checkbox = document.getElementById('termos');
  if (!checkbox.checked) { alert('Você precisa aceitar os termos!'); return; }

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { alert(error.message); } 
  else {
    alert('Logado com sucesso 🚀'); 
    console.log(data);
    checarLogin(); 
    loadPage('sobrenos.html'); // espera carregar antes de atualizar links
  }
}

// -------------------- LOGOUT --------------------
document.getElementById("logout-a").addEventListener("click", async (e) => {
  e.preventDefault()
  await supabaseClient.auth.signOut()
  await checarLogin(); // Atualiza estado de login antes de mostrar mensagem
})

// -------------------- SPEECH --------------------
let falando = false;
let fala = null;

function falarTexto(texto) {
  if (falando) { speechSynthesis.cancel(); falando = false; return; }

  fala = new SpeechSynthesisUtterance(texto);
  fala.lang = 'pt-BR';
  falando = true;

  fala.onend = () => { falando = false; }

  speechSynthesis.speak(fala);
}

// -------------------- SALVAR ÁRVORE --------------------
async function salvarArvore(event) {
  event.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const latitude = document.getElementById('latitude').value.trim();
  const longitude = document.getElementById('longitude').value.trim();

  // substitui vírgula por ponto
  const latitudePonto = latitude.replace(',', '.');
  const longitudePonto = longitude.replace(',', '.');


  if (isNaN(latitudePonto) || isNaN(longitudePonto)) { alert('Latitude ou Longitude inválidas!'); return; }

  const latNum = parseFloat(latitudePonto);
  const lonNum = parseFloat(longitudePonto);

  const casasDecimais = (num) => {
    const partes = num.toString().split('.');
    return partes[1] ? partes[1].length : 0;
  };

  if (casasDecimais(latNum) < 6 || casasDecimais(lonNum) < 6) {
    alert('Latitude e Longitude precisam ter pelo menos 6 casas decimais!');
    return;
  }

  const coord = `POINT(${lonNum} ${latNum})`;

  const { error } = await supabaseClient.from('arvores').insert([{ nome: nome || null, coord }]);
  if (error) { console.error(error); alert('Erro ao salvar a árvore 😢'); }
  else { alert('Árvore salva 🌱'); document.getElementById('form-arvore').reset(); }
}
