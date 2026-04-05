
document.addEventListener("DOMContentLoaded", () => {
    const topo = document.getElementById('topo');
    const contentDiv = document.getElementById('content');

    if (!topo || !contentDiv) {
      console.error("ERRO: Não achei o id='topo' ou o id='content' no HTML!");
      return;
    }

    async function loadPage(url) {
      console.log("Tentando carregar:", url);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Arquivo não encontrado: " + url);
        
        const html = await response.text();
        contentDiv.innerHTML = html;
      } catch (error) {
        console.error(error);
        contentDiv.innerHTML = "<p style='color:red'>Erro ao carregar: " + url + ". Verifique se o nome do arquivo está certo.</p>";
      }
    }

    // Carrega a página inicial
    loadPage('sobrenos.html');

    // Clique nos links
    topo.addEventListener('click', (e) => {
      const el = e.target;
      
      // Verifica se clicou em um link
      if (el.tagName === 'A') {
        e.preventDefault();
        console.log("Link clicado:", el.getAttribute('data-link'));

        // Troca a classe
        const links = topo.querySelectorAll('a');
        links.forEach(l => l.classList.remove('current'));
        el.classList.add('current');

        // Carrega o arquivo
        const page = el.getAttribute('data-link');
        if (page) loadPage(page);
      }
    });
  });


function falarTexto(texto) {
    if ('speechSynthesis' in window) {
        const mensagem = new SpeechSynthesisUtterance(texto);
        mensagem.lang = 'pt-BR'; // Define o idioma
        window.speechSynthesis.speak(mensagem);
    } else {
        alert("Desculpe, seu navegador não suporta TTS.");
    }
}





let falando = false;
let fala = null;

function falarTexto(texto) {
  // Se já estiver falando, cancela
  if (falando) {
    speechSynthesis.cancel();
    falando = false;
    return;
  }

  // Cria a fala
  fala = new SpeechSynthesisUtterance(texto);
  falando = true;

  fala.onend = () => {
    falando = false;
  }

  speechSynthesis.speak(fala);
}









const { createClient } = supabase;

const supabaseClient = createClient(
  'https://vnclvuluqpgcbbrpzwqw.supabase.co',
  'sb_publishable_unHIUHkfh5ojHtX3fInLxA_JQPLAkG4'
);








window.onload = async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();

  const loginA = document.getElementById("login-a")
  const userArea = document.getElementById("user-area")
  const userName = document.getElementById("user-name")

  // Checagem inicial
  if (session?.user) {
    loginA.style.display = "none"
    userArea.style.display = "block"
    userName.textContent = session.user.email
  }

  // Atualiza automaticamente quando loga/desloga
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      console.log("LOGADO:", session.user.email)
      loginA.style.display = "none"
      userArea.style.display = "block"
      userName.textContent = session.user.email
    } else {
      console.log("NÃO LOGADO")
      loginA.style.display = "block"
      userArea.style.display = "none"
      userName.textContent = ""
    }
  })
}

document.getElementById("logout-a").addEventListener("click", async (e) => {
  e.preventDefault()
  await supabaseClient.auth.signOut()
})


async function signup() {

  const checkbox = document.getElementById('termos');

  if (!checkbox.checked) {
    alert('Você precisa aceitar os termos!');
    return; // para o signup
  }



  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    alert('Conta criada! Verifica o email 📩');
  }

  console.log("DATA:", data);
  console.log("ERROR:", error);

  if (error) alert(error.message);
}

async function login() {

  const checkbox = document.getElementById('termos');

  if (!checkbox.checked) {
    alert('Você precisa aceitar os termos!');
    return;
  }

  

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    alert('Logado com sucesso 🚀');
    console.log(data);
    loadPage('sobrenos.html');
  }
}

async function getUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  console.log(user);
}
