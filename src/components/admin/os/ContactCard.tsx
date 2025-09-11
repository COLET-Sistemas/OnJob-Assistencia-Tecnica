import React from "react";
import { motion } from "framer-motion";
import InfoItem from "./InfoItem";
import { Phone, Mail, User } from "lucide-react";

interface ContactCardProps {
  contato: {
    id?: number;
    nome?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
  };
  delay?: number;
}

const ContactCard: React.FC<ContactCardProps> = ({ contato, delay = 0 }) => {
  if (!contato || !contato.nome) return null;

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay * 0.1 }}
      >
        <InfoItem
          label="Contato"
          value={contato.nome}
          icon={<User className="h-4 w-4" />}
        />

        {contato.telefone && (
          <div className="mt-3">
            <InfoItem
              label="Telefone"
              value={
                <a
                  href={`tel:${contato.telefone.replace(/\D/g, "")}`}
                  className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                >
                  {contato.telefone}
                </a>
              }
              icon={<Phone className="h-4 w-4" />}
            />
          </div>
        )}

        {contato.whatsapp && (
          <div className="mt-3">
            <InfoItem
              label="WhatsApp"
              value={
                <a
                  href={`https://wa.me/${contato.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                >
                  {contato.whatsapp}
                </a>
              }
              icon={<Phone className="h-4 w-4" />}
            />
          </div>
        )}

        {contato.email && (
          <div className="mt-3">
            <InfoItem
              label="Email"
              value={
                <a
                  href={`mailto:${contato.email}`}
                  className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors break-words"
                >
                  {contato.email}
                </a>
              }
              icon={<Mail className="h-4 w-4" />}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ContactCard;
