import readline from "readline";
import fetch from "node-fetch";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const anonId = "teste-cli-" + Math.random().toString(36).substring(7);


async function enviarMensagem(mensagem) {
  try {
    const res = await fetch(`https://api-personia.onrender.com/chat/${PERSONAGEM_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: mensagem,
        anonId: anonId
      })
    });
    
    const data = await res.json();

    if (data.error) {
      // Error handling
    } else {
      if (data.figurinha) {
        // Sticker sent
      }
    }
  } catch (err) {
    console.error("Erro ao conectar com o servidor:", err.message);
  }
}

function perguntar() {
  rl.question("Você: ", async (mensagem) => {
    if (mensagem.toLowerCase() === "sair") {
      rl.close();
      return;
    }

    await enviarMensagem(mensagem);
    perguntar();
  });
}

perguntar();