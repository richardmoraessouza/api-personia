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
      console.log(`Erro da IA: ${data.error}`);
    } else {
      console.log(`IA: ${data.reply}`);
      if (data.figurinha) {
        console.log(`[Figurinha enviada: ${data.figurinha}]`);
      }
      console.log("");
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