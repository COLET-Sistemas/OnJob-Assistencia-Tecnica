// Teste simples para verificar o funcionamento do controle de licença
// Este arquivo pode ser executado no console do navegador para testar a funcionalidade

// Simular mudança de licença no localStorage para teste
const testLicenseControl = () => {
  console.log("🔧 Iniciando teste de controle de licença...");

  // Função para simular uma empresa com diferentes tipos de licença
  const setLicenseTipo = (tipo) => {
    const empresaData = {
      id_empresa: 1,
      razao_social: "Empresa Teste",
      licenca_tipo: tipo,
    };

    localStorage.setItem("empresa", JSON.stringify(empresaData));
    localStorage.setItem("licenca_tipo", tipo);

    console.log(`✅ Licença alterada para: ${tipo}`);

    // Disparar evento de mudança para atualizar os hooks
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "empresa",
        newValue: JSON.stringify(empresaData),
      })
    );
  };

  // Testes com diferentes tipos de licença
  console.log("\n📋 Testando diferentes tipos de licença:");

  console.log(
    "\n1. Testando Licença Silver (S) - Deve BLOQUEAR peças e tipos de peças:"
  );
  setLicenseTipo("S");

  setTimeout(() => {
    console.log("\n2. Testando Licença Gold (G) - Deve PERMITIR acesso total:");
    setLicenseTipo("G");

    setTimeout(() => {
      console.log(
        "\n3. Testando Licença Platinum (P) - Deve PERMITIR acesso total:"
      );
      setLicenseTipo("P");

      console.log(
        "\n🎯 Teste concluído! Verifique os ícones de cadeado no sidebar."
      );
      console.log(
        "💡 Para voltar ao Silver e ver os cadeados: testLicenseControl.setToSilver()"
      );
    }, 1000);
  }, 1000);
};

// Função auxiliar para definir rapidamente como Silver
testLicenseControl.setToSilver = () => {
  const empresaData = {
    id_empresa: 1,
    razao_social: "Empresa Teste",
    licenca_tipo: "S",
  };
  localStorage.setItem("empresa", JSON.stringify(empresaData));
  localStorage.setItem("licenca_tipo", "S");
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "empresa",
      newValue: JSON.stringify(empresaData),
    })
  );
  console.log("🔒 Licença definida como Silver - Verifique os cadeados!");
};

// Função auxiliar para definir como Gold
testLicenseControl.setToGold = () => {
  const empresaData = {
    id_empresa: 1,
    razao_social: "Empresa Teste",
    licenca_tipo: "G",
  };
  localStorage.setItem("empresa", JSON.stringify(empresaData));
  localStorage.setItem("licenca_tipo", "G");
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "empresa",
      newValue: JSON.stringify(empresaData),
    })
  );
  console.log("🔓 Licença definida como Gold - Sem restrições!");
};

// Função para verificar estado atual
testLicenseControl.checkCurrent = () => {
  const empresa = localStorage.getItem("empresa");
  if (empresa) {
    const parsed = JSON.parse(empresa);
    console.log(`📊 Licença atual: ${parsed.licenca_tipo || "Não definido"}`);
  } else {
    console.log("❌ Nenhuma empresa encontrada no localStorage");
  }
};

// Disponibilizar globalmente para uso no console
if (typeof window !== "undefined") {
  window.testLicenseControl = testLicenseControl;
  console.log("🚀 Funções de teste disponíveis:");
  console.log("• testLicenseControl() - Executa teste completo");
  console.log("• testLicenseControl.setToSilver() - Define licença Silver");
  console.log("• testLicenseControl.setToGold() - Define licença Gold");
  console.log("• testLicenseControl.checkCurrent() - Verifica licença atual");
}

export default testLicenseControl;
