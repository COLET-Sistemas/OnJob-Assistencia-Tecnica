"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { dashboardService } from "@/api/services/dashboardService";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import {
  RefreshCcw,
  PieChart,
  User,
  BarChartHorizontal,
  Filter,
  AlertCircle,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import "./dashboard.css";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Define interface for dashboard data
interface DashboardData {
  cards: {
    os_abertas_total: number;
    os_encerradas_total: number;
    os_abertas_mes: number;
    os_encerradas_mes: number;
    os_abertas_hoje: number;
    os_encerradas_hoje: number;
    os_aberto_total: number;
    os_aberto_garantia: number;
    os_aberto_pendentes: number;
  };
  graficos: {
    motivos_atendimento: {
      descricao: string;
      quantidade: number;
    }[];
    por_tecnico: {
      nome: string;
      quantidade: number;
    }[];
    top_clientes: {
      cliente: string;
      quantidade: number;
    }[];
  };
}

// Period options for filtering
const periodOptions = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "60", label: "Últimos 60 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "mes", label: "Este mês" },
  { value: "ano", label: "Este ano" },
  { value: "sempre", label: "Sempre" },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // Valor padrão conforme API
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Handle refresh with useCallback para evitar re-renderizações desnecessárias
  const handleRefresh = useCallback(() => {
    // Força uma atualização dos dados, incluindo os cards desta vez
    setIsRefreshing(true);
    setInitialLoad(true); // Forçar atualização dos cards também
    const currentPeriod = selectedPeriod;
    setSelectedPeriod("");
    setTimeout(() => setSelectedPeriod(currentPeriod), 10);
  }, [selectedPeriod]);

  // Color palettes - Cores mais vibrantes para gráficos coloridos
  const chartColors = useMemo(
    () => [
      "#FF6384", // Rosa vibrante
      "#36A2EB", // Azul vibrante
      "#FFCE56", // Amarelo vibrante
      "#4BC0C0", // Verde água
      "#9966FF", // Roxo vibrante
      "#FF9F40", // Laranja
      "#8AC926", // Verde limão
      "#C9184A", // Vermelho escuro
      "#FF85EA", // Rosa claro
      "#00F5D4", // Verde água neon
      "#7B54BE", // Roxo principal
      "#FDAD15", // Amarelo/Laranja
      "#1982C4", // Azul médio
      "#FF595E", // Vermelho coral
      "#6A4C93", // Roxo médio
      "#FFCA3A", // Amarelo médio
      "#00AFB9", // Azul esverdeado
      "#FB5607", // Laranja brilhante
      "#8338EC", // Roxo intenso
      "#3A86FF", // Azul brilhante
    ],
    []
  );

  // State para controlar o carregamento inicial vs. atualização apenas dos gráficos
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch dashboard data based on selected period
  useEffect(() => {
    // Não faz nada se o período estiver vazio (usado no refresh)
    if (!selectedPeriod) return;

    const fetchData = async () => {
      // Mostra loading apenas no carregamento inicial
      if (initialLoad) {
        setIsLoading(true);
      } else {
        // Nas filtragens posteriores, mostrar apenas refreshing nos gráficos
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const params: Record<string, string> = {
          periodo: selectedPeriod,
        };

        const response = await dashboardService.getGestorData(params);

        console.log("Dashboard API response:", response);

        // Processar cards data
        const newCardsData = {
          os_abertas_total: response.cards.os_abertas_total || 0,
          os_encerradas_total: response.cards.os_encerradas_total || 0,
          os_abertas_mes: response.cards.os_abertas_mes || 0,
          os_encerradas_mes: response.cards.os_encerradas_mes || 0,
          os_abertas_hoje: response.cards.os_abertas_hoje || 0,
          os_encerradas_hoje: response.cards.os_encerradas_hoje || 0,
          os_aberto_total: response.cards.os_aberto_total || 0,
          os_aberto_garantia: response.cards.os_aberto_garantia || 0,
          os_aberto_pendentes: response.cards.os_aberto_pendentes || 0,
        };

        // Na primeira carga, atualizamos o flag para indicar que é carga subsequente
        if (initialLoad) {
          setInitialLoad(false);
        }

        // Atualizar dados do dashboard
        setDashboardData((prevData) => {
          if (!prevData) {
            // Caso não exista dados prévios, criar objeto completo
            return {
              cards: newCardsData,
              graficos: {
                motivos_atendimento:
                  response.graficos.motivos_atendimento || [],
                por_tecnico: response.graficos.por_tecnico || [],
                top_clientes: response.graficos.top_clientes || [],
              },
            };
          } else {
            // Caso existam dados prévios, atualizar apenas os gráficos
            return {
              // Manter os cards existentes se não for o carregamento inicial
              cards: initialLoad ? newCardsData : prevData.cards,
              // Sempre atualizar os gráficos
              graficos: {
                motivos_atendimento:
                  response.graficos.motivos_atendimento || [],
                por_tecnico: response.graficos.por_tecnico || [],
                top_clientes: response.graficos.top_clientes || [],
              },
            };
          }
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          "Não foi possível carregar os dados do dashboard. Tente novamente mais tarde."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
  }, [selectedPeriod, initialLoad]);

  // Prepare chart data usando useMemo para evitar re-cálculos desnecessários
  const pieChartData = useMemo(
    () => ({
      labels:
        dashboardData?.graficos.motivos_atendimento.map(
          (item) => item.descricao
        ) || [],
      datasets: [
        {
          data:
            dashboardData?.graficos.motivos_atendimento.map(
              (item) => item.quantidade
            ) || [],
          backgroundColor: chartColors.slice(
            0,
            dashboardData?.graficos.motivos_atendimento.length || 0
          ),
          borderColor: "white",
          borderWidth: 2,
          borderRadius: 5,
          hoverBackgroundColor: chartColors.slice(
            0,
            dashboardData?.graficos.motivos_atendimento.length || 0
          ), // Mantém a mesma cor no hover
          hoverBorderColor: "white",
        },
      ],
    }),
    [dashboardData?.graficos.motivos_atendimento, chartColors]
  );

  const verticalBarChartData = useMemo(() => {
    const backgroundColors =
      dashboardData?.graficos.por_tecnico.map(
        (_, idx) => chartColors[idx % chartColors.length]
      ) || [];

    return {
      labels:
        dashboardData?.graficos.por_tecnico.map((item) => item.nome) || [],
      datasets: [
        {
          label: "Ordens de Serviço",
          data:
            dashboardData?.graficos.por_tecnico.map(
              (item) => item.quantidade
            ) || [],
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors, // Mantém a mesma cor no hover
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [dashboardData?.graficos.por_tecnico, chartColors]);

  const horizontalBarChartData = useMemo(() => {
    const backgroundColors =
      dashboardData?.graficos.top_clientes
        .slice(0, 20)
        .map((_, idx) => chartColors[(idx + 5) % chartColors.length]) || [];

    return {
      labels:
        dashboardData?.graficos.top_clientes
          .slice(0, 20)
          .map((item) => item.cliente) || [],
      datasets: [
        {
          label: "OSs Abertas",
          data:
            dashboardData?.graficos.top_clientes
              .slice(0, 20)
              .map((item) => item.quantidade) || [],
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors, // Mantém a mesma cor no hover
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [dashboardData?.graficos.top_clientes, chartColors]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          font: {
            size: 11,
          },
          color: "#555",
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#333",
        bodyColor: "#555",
        titleFont: {
          weight: "bold" as const,
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 6,
        displayColors: true,
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
    },
  };

  const horizontalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      title: {
        display: true,
        text: "Top 20 Clientes com OSs Abertas",
        font: {
          size: 14,
          weight: "bold" as const,
          family: "'Inter', sans-serif",
        },
        color: "#333",
        padding: 10,
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#333",
        bodyColor: "#555",
        titleFont: {
          weight: "bold" as const,
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 6,
        displayColors: true,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#666",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      y: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          font: {
            size: 11,
          },
          color: "#666",
        },
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 1000,
    },
  };

  // Card data with updated titles and organized by rows
  const cards = [
    // Primeira linha - OSs abertas (Roxo)
    {
      title: "OSs abertas até hoje",
      value: dashboardData?.cards.os_abertas_total || 0,
      color: "#7B54BE", // Roxo principal
      bgColor: "#7B54BE", // Fundo roxo
    },
    {
      title: "OSs abertas no mês",
      value: dashboardData?.cards.os_abertas_mes || 0,
      color: "#7B54BE", // Roxo principal
      bgColor: "#7B54BE", // Fundo roxo
    },
    {
      title: "OSs abertas hoje",
      value: dashboardData?.cards.os_abertas_hoje || 0,
      color: "#7B54BE", // Roxo principal
      bgColor: "#7B54BE", // Fundo roxo
    },
    // Segunda linha - OSs atendidas (Amarelo)
    {
      title: "OSs atendidas até hoje",
      value: dashboardData?.cards.os_encerradas_total || 0,
      color: "#FDAD15", // Amarelo/Laranja
      bgColor: "#FDAD15", // Fundo amarelo
    },
    {
      title: "OSs atendidas no mês",
      value: dashboardData?.cards.os_encerradas_mes || 0,
      color: "#FDAD15", // Amarelo/Laranja
      bgColor: "#FDAD15", // Fundo amarelo
    },
    {
      title: "OSs atendidas hoje",
      value: dashboardData?.cards.os_encerradas_hoje || 0,
      color: "#FDAD15", // Amarelo/Laranja
      bgColor: "#FDAD15", // Fundo amarelo
    },
    // Terceira linha - OSs em aberto/pendentes (Verde)
    {
      title: "OSs em aberto agora",
      value: dashboardData?.cards.os_aberto_total || 0,
      color: "#75f9bd", // Verde
      bgColor: "#75f9bd", // Fundo verde
    },
    {
      title: "OSs em aberto em garantia",
      value: dashboardData?.cards.os_aberto_garantia || 0,
      color: "#75f9bd", // Verde
      bgColor: "#75f9bd", // Fundo verde
    },
    {
      title: "OSs pendentes agora",
      value: dashboardData?.cards.os_aberto_pendentes || 0,
      color: "#75f9bd", // Verde
      bgColor: "#75f9bd", // Fundo verde
    },
  ];

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Loading state */}
      {isLoading && (
        <div className="py-20">
          <LoadingSpinner
            size="large"
            text="Carregando indicadores"
            color="primary"
            showText={true}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-white border-l-3 border-l-red-500 rounded-xl p-5 text-gray-700 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-red-50 p-2 animate-pulse">
              <AlertCircle
                size={20}
                strokeWidth={1.5}
                className="text-red-500"
              />
            </div>
            <p className="font-medium animate-slideIn">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 ml-0 sm:ml-9">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 focus-ring ${
                isRefreshing
                  ? "bg-red-50 text-red-400"
                  : "bg-red-500 text-white hover:bg-red-600 hover:shadow"
              }`}
            >
              {isRefreshing ? "Tentando novamente..." : "Tentar novamente"}
            </button>
            <button
              onClick={() => setError(null)}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100 transition-all duration-300 focus-ring"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Dashboard content */}
      {!isLoading && !error && dashboardData && (
        <>
          {/* Cards Grid - Agora organizado por linhas conforme solicitado */}
          <div className="grid gap-3 sm:gap-4">
            {/* Primeira linha - OSs abertas (Roxo) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {cards.slice(0, 3).map((card, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] animate-fadeIn"
                  style={{
                    backgroundColor: card.bgColor,
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-2xl sm:text-3xl font-bold text-center text-white">
                      {card.value.toLocaleString()}
                    </p>
                    <p className="text-white text-sm text-center mt-2 font-medium">
                      {card.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Segunda linha - OSs atendidas (Amarelo) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {cards.slice(3, 6).map((card, index) => (
                <div
                  key={index + 3}
                  className="rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] animate-fadeIn"
                  style={{
                    backgroundColor: card.bgColor,
                    animationDelay: `${(index + 3) * 50}ms`,
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-2xl sm:text-3xl font-bold text-center text-white">
                      {card.value.toLocaleString()}
                    </p>
                    <p className="text-white text-sm text-center mt-2 font-medium">
                      {card.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Terceira linha - OSs em aberto/pendentes (Verde) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {cards.slice(6, 9).map((card, index) => (
                <div
                  key={index + 6}
                  className="rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] animate-fadeIn"
                  style={{
                    backgroundColor: card.bgColor,
                    animationDelay: `${(index + 6) * 50}ms`,
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-2xl sm:text-3xl font-bold text-center text-white">
                      {card.value.toLocaleString()}
                    </p>
                    <p className="text-white text-sm text-center mt-2 font-medium">
                      {card.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Period selector - Movido para abaixo dos cards */}
          <div className="bg-white p-4 rounded-xl shadow-sm animate-slideIn flex flex-col sm:flex-row justify-center items-center gap-3">
            <div className="relative w-full max-w-xs flex items-center">
              <div className="absolute left-2 pointer-events-none text-[#7B54BE]">
                <Filter size={16} strokeWidth={1.5} />
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none border-0 bg-[#F0EBFF] text-[#7B54BE] rounded-md pl-8 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B54BE] w-full transition-all duration-300 focus-ring"
                title="Alterar o período irá atualizar apenas os gráficos"
              >
                <option value="" disabled>
                  Selecione um período
                </option>
                {periodOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="text-gray-800"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-0 inset-y-0 flex items-center px-2 text-[#7B54BE]">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`ml-4 focus-ring flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 animate-scaleIn ${
                isRefreshing
                  ? "bg-[#F0EBFF] text-[#7B54BE] opacity-70 cursor-not-allowed"
                  : "bg-[#7B54BE] text-white hover:opacity-90"
              }`}
              aria-label="Atualizar dados"
            >
              <RefreshCcw
                size={15}
                strokeWidth={1.5}
                className={`${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
            </button>
          </div>

          {/* Charts Section */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 relative charts-container charts-refresh-transition ${
              isRefreshing && !isLoading ? "charts-refreshing" : ""
            }`}
          >
            {/* Overlay for when charts are refreshing */}
            {isRefreshing && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg flex items-center space-x-3">
                  <RefreshCcw className="w-5 h-5 text-[#7B54BE] animate-spin" />
                  <span className="text-sm font-medium text-gray-700">
                    Atualizando gráficos...
                  </span>
                </div>
              </div>
            )}

            {/* Pie Chart - Distribuição de OSs por Motivo */}
            <div
              className={`bg-white p-4 rounded-xl shadow-sm h-[350px] sm:h-[400px] hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] animate-fadeIn card-delay-1 chart-container ${
                isRefreshing && !isLoading ? "chart-refreshing" : ""
              }`}
              style={{ borderLeft: "3px solid #7B54BE" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-sm sm:text-base text-gray-800 animate-slideIn"
                  style={{ animationDelay: "100ms" }}
                >
                  OSs por Motivo de Atendimento
                </h3>
                <div className="p-1.5 rounded-md bg-[#F0EBFF]">
                  <PieChart
                    size={18}
                    strokeWidth={1.5}
                    className="text-[#7B54BE]"
                  />
                </div>
              </div>
              <div
                className="h-[270px] sm:h-[320px] flex items-center justify-center animate-scaleIn"
                style={{ animationDelay: "200ms" }}
              >
                {dashboardData.graficos.motivos_atendimento.length > 0 ? (
                  <Pie data={pieChartData} options={chartOptions} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <div className="p-4 rounded-full bg-gray-100">
                      <PieChart
                        size={30}
                        strokeWidth={1.5}
                        className="text-gray-400"
                      />
                    </div>
                    <p className="text-gray-500 text-center text-sm mt-3">
                      Não há dados suficientes para este gráfico
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart - OSs por Técnico */}
            <div
              className={`bg-white p-4 rounded-xl shadow-sm h-[350px] sm:h-[400px] hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] animate-fadeIn card-delay-2 chart-container ${
                isRefreshing && !isLoading ? "chart-refreshing" : ""
              }`}
              style={{ borderLeft: "3px solid #75f9bd" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-sm sm:text-base text-gray-800 animate-slideIn"
                  style={{ animationDelay: "150ms" }}
                >
                  OSs por Técnico
                </h3>
                <div className="p-1.5 rounded-md bg-[#E6FFF2]">
                  <User
                    size={18}
                    strokeWidth={1.5}
                    className="text-[#75f9bd]"
                  />
                </div>
              </div>
              <div
                className="h-[270px] sm:h-[320px] flex items-center justify-center animate-scaleIn"
                style={{ animationDelay: "250ms" }}
              >
                {dashboardData.graficos.por_tecnico.length > 0 ? (
                  <div className="relative h-full">
                    <Bar
                      data={verticalBarChartData}
                      options={{
                        ...chartOptions,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { precision: 0 },
                          },
                          x: {
                            ticks: { color: "#666" },
                          },
                        },
                        layout: {
                          padding: {
                            top: 25,
                          },
                        },
                      }}
                    />
                    {/* Adicionar rótulos em divs absolutas em cima do gráfico */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-around items-start pt-3">
                      {dashboardData.graficos.por_tecnico.map((item, idx) => (
                        <div
                          key={idx}
                          className="text-xs font-bold text-gray-700"
                        >
                          {item.quantidade}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <div className="p-4 rounded-full bg-gray-100">
                      <User
                        size={30}
                        strokeWidth={1.5}
                        className="text-gray-400"
                      />
                    </div>
                    <p className="text-gray-500 text-center text-sm mt-3">
                      Não há dados suficientes para este gráfico
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Bar Chart - Top 20 Clientes */}
            <div
              className={`bg-white p-4 rounded-xl shadow-sm h-[350px] sm:h-[400px] hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] md:col-span-2 lg:col-span-1 animate-fadeIn card-delay-3 chart-container ${
                isRefreshing && !isLoading ? "chart-refreshing" : ""
              }`}
              style={{ borderLeft: "3px solid #abc7e0" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-sm sm:text-base text-gray-800 animate-slideIn"
                  style={{ animationDelay: "200ms" }}
                >
                  Top 20 Clientes com OSs
                </h3>
                <div className="p-1.5 rounded-md bg-[#E6F0F9]">
                  <BarChartHorizontal
                    size={18}
                    strokeWidth={1.5}
                    className="text-[#abc7e0]"
                  />
                </div>
              </div>
              <div
                className="h-[270px] sm:h-[320px] flex items-center justify-center animate-scaleIn"
                style={{ animationDelay: "300ms" }}
              >
                {dashboardData.graficos.top_clientes.length > 0 ? (
                  <div className="relative h-full">
                    <Bar
                      data={horizontalBarChartData}
                      options={{
                        ...horizontalChartOptions,
                        layout: {
                          padding: {
                            right: 40,
                          },
                        },
                      }}
                    />
                    {/* Adicionar rótulos em divs absolutas no final das barras */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                      {dashboardData.graficos.top_clientes
                        .slice(0, 20)
                        .map((item, idx) => {
                          // Calcular a posição vertical aproximada para cada item
                          const totalItems = Math.min(
                            20,
                            dashboardData.graficos.top_clientes.length
                          );
                          const heightPerItem = 100 / totalItems;
                          const topPosition = `${
                            heightPerItem * idx + heightPerItem / 2
                          }%`;

                          return (
                            <div
                              key={idx}
                              className="absolute right-2 transform -translate-y-1/2 text-xs font-bold text-gray-700"
                              style={{ top: topPosition }}
                            >
                              {item.quantidade}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <div className="p-4 rounded-full bg-gray-100">
                      <BarChartHorizontal
                        size={30}
                        strokeWidth={1.5}
                        className="text-gray-400"
                      />
                    </div>
                    <p className="text-gray-500 text-center text-sm mt-3">
                      Não há dados suficientes para este gráfico
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
