import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function DetalheColaborador() {
  const { id } = useParams();

  const [dados, setDados] = useState(null);

  async function carregarDados() {
    const response = await api.get(
      `/colaboradores/${id}`
    );

    setDados(response.data);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  if (!dados) {
    return (
      <div className="text-white">
        Carregando...
      </div>
    );
  }

  const {
  colaborador,
  faltas,
  advertencias,
  suspensoes
} = dados;

const eventos = [
  ...faltas.map((falta) => ({
    id: `falta-${falta.id}`,
    data: falta.data_falta || falta.data,
    tipo: "Falta",
    titulo: "Falta registrada",
    descricao: falta.motivo || "Sem motivo informado",
    cor: "bg-yellow-500/20 text-yellow-400",
  })),

  ...advertencias.map((advertencia) => ({
    id: `advertencia-${advertencia.id}`,
    data: advertencia.data_advertencia || advertencia.data,
    tipo: "Advertência",
    titulo: advertencia.tipo,
    descricao: advertencia.motivo,
    cor: "bg-orange-500/20 text-orange-400",
  })),

  ...suspensoes.map((suspensao) => ({
    id: `suspensao-${suspensao.id}`,
    data: suspensao.data_inicio,
    tipo: "Suspensão",
    titulo: `${suspensao.dias} dia(s)`,
    descricao: suspensao.motivo,
    cor: "bg-red-500/20 text-red-400",
  })),
].sort((a, b) => new Date(b.data) - new Date(a.data));

return (
  <>
    <div className="
      flex
      items-center
      justify-between
    ">

      <div>

        <h1 className="
          text-4xl
          font-bold
        ">
          {colaborador.nome}
        </h1>

        <p className="
          text-zinc-400
          mt-2
        ">
          CPF: {colaborador.cpf}
        </p>

      </div>

      <span className={`
        px-4
        py-2
        rounded-full
        text-sm
        font-medium
        ${
          colaborador.ativo
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        }
      `}>
        {
          colaborador.ativo
            ? "Ativo"
            : "Inativo"
        }
      </span>

    </div>

    <div className="
      mt-10
      grid
      grid-cols-3
      gap-6
    ">

      {/* FALTAS */}
      <div className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-6
      ">

        <h2 className="
          text-xl
          font-semibold
          mb-6
        ">
          Faltas
        </h2>

        <div className="space-y-4">

          {faltas.length === 0 && (
            <p className="text-zinc-500">
              Nenhuma falta registrada
            </p>
          )}

          {faltas.map((falta) => (

            <div
              key={falta.id}
              className="
                border
                border-zinc-800
                rounded-xl
                p-4
              "
            >

              <p className="font-medium">
                {falta.data_falta || falta.data}
              </p>

              <p className="
                text-zinc-400
                text-sm
                mt-1
              ">
                {falta.motivo}
              </p>

            </div>

          ))}

        </div>

      </div>

      {/* ADVERTÊNCIAS */}
      <div className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-6
      ">

        <h2 className="
          text-xl
          font-semibold
          mb-6
        ">
          Advertências
        </h2>

        <div className="space-y-4">

          {advertencias.length === 0 && (
            <p className="text-zinc-500">
              Nenhuma advertência
            </p>
          )}

          {advertencias.map((advertencia) => (

            <div
              key={advertencia.id}
              className="
                border
                border-zinc-800
                rounded-xl
                p-4
              "
            >

              <div className="
                flex
                items-center
                justify-between
              ">

                <p className="font-medium">
                  {advertencia.data_advertencia || advertencia.data}
                </p>

                <span className="
                  bg-yellow-500/20
                  text-yellow-400
                  text-xs
                  px-2
                  py-1
                  rounded-full
                ">
                  {advertencia.tipo}
                </span>

              </div>

              <p className="
                text-zinc-400
                text-sm
                mt-2
              ">
                {advertencia.motivo}
              </p>

            </div>

          ))}

        </div>

      </div>

      {/* SUSPENSÕES */}
      <div className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-6
      ">

        <h2 className="
          text-xl
          font-semibold
          mb-6
        ">
          Suspensões
        </h2>

        <div className="space-y-4">

          {suspensoes.length === 0 && (
            <p className="text-zinc-500">
              Nenhuma suspensão
            </p>
          )}

          {suspensoes.map((suspensao) => (

            <div
              key={suspensao.id}
              className="
                border
                border-zinc-800
                rounded-xl
                p-4
              "
            >

              <div className="
                flex
                items-center
                justify-between
              ">

                <p className="font-medium">
                  {suspensao.data_inicio}
                </p>

                <span className="
                  bg-red-500/20
                  text-red-400
                  text-xs
                  px-2
                  py-1
                  rounded-full
                ">
                  {suspensao.status}
                </span>

              </div>

              <p className="
                text-zinc-400
                text-sm
                mt-2
              ">
                {suspensao.dias} dia(s)
              </p>

              <p className="
                text-zinc-500
                text-sm
                mt-1
              ">
                {suspensao.motivo}
              </p>

            </div>

          ))}

        </div>

      </div>

    </div>

    {/* TIMELINE */}
    <div className="
      mt-10
      bg-zinc-900
      border
      border-zinc-800
      rounded-2xl
      p-6
    ">

      <h2 className="
        text-2xl
        font-bold
        mb-6
      ">
        Timeline de ocorrências
      </h2>

      {eventos.length === 0 ? (
        <p className="text-zinc-500">
          Nenhuma ocorrência registrada.
        </p>
      ) : (
        <div className="space-y-4">

          {eventos.map((evento) => (

            <div
              key={evento.id}
              className="
                border
                border-zinc-800
                rounded-xl
                p-4
                flex
                items-start
                justify-between
              "
            >

              <div>

                <div className="
                  flex
                  items-center
                  gap-3
                ">

                  <span className={`
                    px-3
                    py-1
                    rounded-full
                    text-sm
                    ${evento.cor}
                  `}>
                    {evento.tipo}
                  </span>

                  <strong>
                    {evento.titulo}
                  </strong>

                </div>

                <p className="
                  text-zinc-400
                  mt-2
                ">
                  {evento.descricao}
                </p>

              </div>

              <span className="
                text-zinc-500
                text-sm
              ">
                {evento.data}
              </span>

            </div>

          ))}

        </div>
      )}

    </div>

  </>
)
}