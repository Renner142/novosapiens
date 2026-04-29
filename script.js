// 1. Inicialização segura do Supabase (Verifica se já existe para não dar erro)
if (typeof supabaseClient === 'undefined') {
  var supabaseClient = supabase.createClient(
    'https://vnclvuluqpgcbbrpzwqw.supabase.co',
    'sb_publishable_unHIUHkfh5ojHtX3fInLxA_JQPLAkG4'
  );
}

// 2. Variável global para o mapa
let meuMapa = null;

// 3. Centralizador de eventos de carregamento
document.addEventListener("DOMContentLoaded", () => {
  console.log("Sistema Inicializado");
  checarLogin();
  
  // Só carrega a página inicial se o conteúdo estiver vazio (evita loops no SPA)
  const contentDiv = document.getElementById('content');
  if (contentDiv && contentDiv.innerHTML.trim() === "<h1>Carregando...</h1>") {
      loadPage('sobrenos.html');
  }

  // Configuração dos links do Topo (Event Delegation)
  const topo = document.getElementById('topo');
  if (topo) {
    topo.addEventListener('click', async (e) => {
      const el = e.target.closest('a'); // Garante que pega o link mesmo clicando no ícone
      if (el && el.dataset.link) {
        e.preventDefault();
        await loadPage(el.dataset.link);
      }
    });
  }
});

// -------------------- FUNÇÃO DO MAPA --------------------
async function inicializarMapa() {
    setTimeout(async () => {
        const container = document.getElementById('map');
        if (!container) return;

        if (meuMapa) {
            meuMapa.remove();
            meuMapa = null;
        }

        try {
            // Inicializa o centro do mapa (Quixadá)
            meuMapa = L.map('map').setView([-4.968, -39.006], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(meuMapa);
            
            // CHAMA A FUNÇÃO PARA CARREGAR OS PONTOS DO BANCO
            await carregarPontosDoBanco();

            setTimeout(() => { if(meuMapa) meuMapa.invalidateSize(); }, 300);
        } catch (e) {
            console.error("Erro ao iniciar mapa:", e);
        }
    }, 200);
}

async function carregarPontosDoBanco() {
  try {
    const { data, error } = await supabaseClient
      .from('arvores_mapa') 
      .select('*');

    if (error) throw error;

    data.forEach(ponto => {
      // Como a View faz o trabalho pesado, aqui é só desenhar
      if (ponto.lat && ponto.lng) {
        L.marker([ponto.lat, ponto.lng]).addTo(meuMapa)
        .bindPopup(`
            <div style="font-family: sans-serif;">
              <strong style="color: #118f50;">Coordenadas:</strong><br>
              <b>Lat:</b> ${ponto.lat}<br>
              <b>Lng:</b> ${ponto.lng}
            </div>
          `);
      }
    });

    console.log(`Sucesso: ${data.length} pontos renderizados.`);
  } catch (err) {
    console.error("Erro no mapa:", err.message);
  }
}

function inicializarLocalizacao() {
  if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
          function(position) {
              // Tenta encontrar os campos no DOM
              const latInput = document.getElementById('latitude');
              const lonInput = document.getElementById('longitude');
              
              if (latInput && lonInput) {
                  latInput.value = position.coords.latitude;
                  lonInput.value = position.coords.longitude;
              }
          },
          function(error) {
              console.warn('Localização não disponível.');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
  }
}


// -------------------- LOAD PAGE --------------------
async function loadPage(url) {
  const contentDiv = document.getElementById('content');
  console.log("Tentando carregar:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Arquivo não encontrado: " + url);

    const html = await response.text();
    contentDiv.innerHTML = html;
    if (url === 'mapa.html') { 
        inicializarMapa(); 
    }
    if (url === 'coordenadas.html') { 
      inicializarLocalizacao();
  }
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
  const curso = document.getElementById('curso').value;


  
  const latitudePonto = latitude.replace(',', '.');
  const longitudePonto = longitude.replace(',', '.');
  
  
if (!nome) {
  alert('Preencha o nome antes de enviar!');
  return;
}


if (!curso) {
  alert('Selecione seu curso!');
  return;
}

  if (isNaN(latitudePonto) || isNaN(longitudePonto)) {
  alert('Latitude ou Longitude inválidas!');
  return;
}


const temMinimo5Casas = (valor) => {
  const partes = valor.split('.');
  return partes[1] && partes[1].length >= 5;
};

if (!temMinimo5Casas(latitudePonto) || !temMinimo5Casas(longitudePonto)) {
  alert('Latitude e Longitude precisam ter pelo menos 5 casas decimais!');
  return;
}

const coord = `POINT(${longitudePonto} ${latitudePonto})`;


  const { error } = await supabaseClient.from('arvores').insert([{ nome: nome , coord , curso }]);
  if (error) { console.error(error); alert('Erro ao salvar a árvore 😢'); }
  else { alert('Árvore salva 🌱'); document.getElementById('form-arvore').reset(); }
}









