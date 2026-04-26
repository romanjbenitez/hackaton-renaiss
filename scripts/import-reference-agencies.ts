import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { AgencyStatus, GuaranteeType, PropertyStatus, PropertyType, UserRole } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AgencySeed = {
  companyName: string;
  companySlug: string;
  companyTaxId: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  province: string;
  neighborhood: string;
};

type ProfilePreference = "EMPLOYED" | "MONOTRIBUTISTA" | "SELF_EMPLOYED" | "RETIRED";

type PropertyTemplate = {
  sourceTitle: string;
  sourceAddress: string;
  sourceImageUrl: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  squareMeters: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  expenses?: number;
  acceptsPets: boolean;
  acceptsSmokers: boolean;
  acceptsChildren: boolean;
  targetTrustScore: number;
  acceptedGuarantees: GuaranteeType[];
  preferredProfile?: ProfilePreference;
};

const PROPERTY_PHOTOS_BUCKET = "property-photos";

type SourceConfig = {
  key: "paganini" | "uno";
  referenceUrl: string;
  referenceNote: string;
  agencies: AgencySeed[];
  templates: PropertyTemplate[];
  propertiesPerAgency: number;
};

const sourceConfigs: Record<SourceConfig["key"], SourceConfig> = {
  paganini: {
    key: "paganini",
    referenceUrl: "https://paganini.com.ar/",
    referenceNote:
      "Basado en el catálogo público de Paganini Negocios Inmobiliarios; se inventan solo datos necesarios para la demo.",
    agencies: [
      {
        companyName: "Paganini Centro Brokers",
        companySlug: "paganini-centro-brokers",
        companyTaxId: "30-71000001-1",
        phone: "3414201101",
        email: "centro@paganini-brokers-demo.ar",
        firstName: "Luciano",
        lastName: "Paganini",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Centro",
      },
      {
        companyName: "Paganini Martín Living",
        companySlug: "paganini-martin-living",
        companyTaxId: "30-71000002-0",
        phone: "3414201102",
        email: "martin@paganini-brokers-demo.ar",
        firstName: "Paula",
        lastName: "Rossi",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Martin",
      },
      {
        companyName: "Paganini Echesortu Activo",
        companySlug: "paganini-echesortu-activo",
        companyTaxId: "30-71000003-8",
        phone: "3414201103",
        email: "echesortu@paganini-brokers-demo.ar",
        firstName: "Nicolás",
        lastName: "Suárez",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Echesortu",
      },
      {
        companyName: "Paganini Pichincha Urban",
        companySlug: "paganini-pichincha-urban",
        companyTaxId: "30-71000004-6",
        phone: "3414201104",
        email: "pichincha@paganini-brokers-demo.ar",
        firstName: "Carla",
        lastName: "Méndez",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Pichincha",
      },
      {
        companyName: "Paganini Alberdi Norte",
        companySlug: "paganini-alberdi-norte",
        companyTaxId: "30-71000005-4",
        phone: "3414201105",
        email: "alberdi@paganini-brokers-demo.ar",
        firstName: "Federico",
        lastName: "Luna",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Alberdi",
      },
      {
        companyName: "Paganini Lourdes Select",
        companySlug: "paganini-lourdes-select",
        companyTaxId: "30-71000006-2",
        phone: "3414201106",
        email: "lourdes@paganini-brokers-demo.ar",
        firstName: "Valeria",
        lastName: "Costa",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Lourdes",
      },
      {
        companyName: "Paganini Fisherton Casas",
        companySlug: "paganini-fisherton-casas",
        companyTaxId: "30-71000007-0",
        phone: "3414201107",
        email: "fisherton@paganini-brokers-demo.ar",
        firstName: "Tomás",
        lastName: "Bianchi",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Fisherton",
      },
      {
        companyName: "Paganini Funes Premium",
        companySlug: "paganini-funes-premium",
        companyTaxId: "30-71000008-9",
        phone: "3414201108",
        email: "funes@paganini-brokers-demo.ar",
        firstName: "Agustina",
        lastName: "Martínez",
        city: "Funes",
        province: "Santa Fe",
        neighborhood: "Funes",
      },
      {
        companyName: "Paganini Roldán Patio",
        companySlug: "paganini-roldan-patio",
        companyTaxId: "30-71000009-7",
        phone: "3414201109",
        email: "roldan@paganini-brokers-demo.ar",
        firstName: "Santiago",
        lastName: "Giménez",
        city: "Roldán",
        province: "Santa Fe",
        neighborhood: "Roldán",
      },
      {
        companyName: "Paganini Arroyito Gestión",
        companySlug: "paganini-arroyito-gestion",
        companyTaxId: "30-71000010-0",
        phone: "3414201110",
        email: "arroyito@paganini-brokers-demo.ar",
        firstName: "Malena",
        lastName: "Paz",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Arroyito",
      },
    ],
    templates: [
      {
        sourceTitle: "Departamento en Centro de dos dormitorios externo con balcon",
        sourceAddress: "San Juan 1545",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23118050/conversions/1777055465-thumbnail.webp",
        title: "Departamento 2 dormitorios con balcón",
        description:
          "Inspirado en publicaciones de Paganini: living comedor, balcón corrido y buena conectividad al centro.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 85,
        bedrooms: 2,
        bathrooms: 1,
        price: 850000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 72,
        acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
        preferredProfile: "EMPLOYED",
      },
      {
        sourceTitle: "Alem 1351 - Departamento De 1 Dormitorio En Alquiler - Martin, Rosario",
        sourceAddress: "Alem 1351",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23115316/conversions/1777048271-thumbnail.webp",
        title: "Departamento 1 dormitorio lateral",
        description:
          "Unidad compacta de 1 dormitorio con cocina independiente y placard, pensada para alquiler tradicional.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 40,
        bedrooms: 1,
        bathrooms: 1,
        price: 350000,
        acceptsPets: true,
        acceptsSmokers: false,
        acceptsChildren: false,
        targetTrustScore: 58,
        acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
        preferredProfile: "EMPLOYED",
      },
      {
        sourceTitle: "Colon 1256 - Departamento De 1 Dormitorio En Alquiler - Martin, Rosario",
        sourceAddress: "Colon 1256",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23115302/conversions/1777048267-thumbnail.webp",
        title: "Departamento 1 dormitorio con balcón",
        description:
          "Piso alto con balcón y dormitorio amplio, tomado de la tipología más repetida en la referencia.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 40,
        bedrooms: 1,
        bathrooms: 1,
        price: 300000,
        acceptsPets: false,
        acceptsSmokers: true,
        acceptsChildren: false,
        targetTrustScore: 52,
        acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "Cerrito 625 - Departamento De 1 Dormitorio En Alquiler - Republica De La Sexta, Rosario",
        sourceAddress: "Cerrito 625",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23096650/conversions/1776976279-thumbnail.webp",
        title: "Departamento 1 dormitorio contrafrente",
        description:
          "Departamento con balcón, living comedor y expensas moderadas, adaptado para el catálogo del sistema.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 40,
        bedrooms: 1,
        bathrooms: 1,
        price: 400000,
        expenses: 58000,
        acceptsPets: true,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 60,
        acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "Urquiza 1278 - Departamento De 2 Dormitorios En Alquiler - Centro, Rosario",
        sourceAddress: "Urquiza 1278",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23096633/conversions/1776976272-thumbnail.webp",
        title: "Departamento 2 dormitorios contrafrente",
        description:
          "Tipología familiar con balcón y paso distribuidor, útil para candidatos con grupo familiar chico.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 54,
        bedrooms: 2,
        bathrooms: 1,
        price: 650000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 68,
        acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
        preferredProfile: "EMPLOYED",
      },
      {
        sourceTitle: "Pje. Ricardone 1249 - Departamento De 2 Dormitorios En Alquiler - Centro, Rosario",
        sourceAddress: "Pje. Ricardone 1249",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23089407/conversions/1776972687-thumbnail.webp",
        title: "Semipiso 2 dormitorios con doble balcón",
        description:
          "Semipiso externo con orientación norte-este, diseñado para un ticket medio alto dentro del sistema.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 77,
        bedrooms: 2,
        bathrooms: 1,
        price: 550000,
        acceptsPets: true,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 66,
        acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "Cordoba 1589 - Departamento Monoambiente En Alquiler - Centro, Rosario",
        sourceAddress: "Cordoba 1589",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23082708/conversions/1776965465-thumbnail.webp",
        title: "Monoambiente amplio con balcón",
        description:
          "Monoambiente luminoso con balcón corrido, ideal para perfiles individuales de ingreso medio.",
        propertyType: PropertyType.STUDIO,
        squareMeters: 42,
        bedrooms: 1,
        bathrooms: 1,
        price: 450000,
        acceptsPets: false,
        acceptsSmokers: true,
        acceptsChildren: false,
        targetTrustScore: 55,
        acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle:
          "Alvarez Thomas 2750 - Duplex 2 Dormitorios 2 Cocheras En Alquiler - Barrancas De Alberdi, Rosario",
        sourceAddress: "Alvarez Thomas 2750",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23057335/conversions/1776871873-thumbnail.webp",
        title: "Dúplex 2 dormitorios con cocheras",
        description:
          "Dúplex premium con cochera doble, living amplio y perfil de alquiler alto para candidatos sólidos.",
        propertyType: PropertyType.HOUSE,
        squareMeters: 170,
        bedrooms: 2,
        bathrooms: 3,
        price: 1700000,
        acceptsPets: true,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 84,
        acceptedGuarantees: [GuaranteeType.MORTGAGE],
        preferredProfile: "EMPLOYED",
      },
      {
        sourceTitle: "Bv. Segui 1036 - Casa De 4 Dormitorios Con Cochera En Alquiler - Rosario",
        sourceAddress: "Bv. Segui 1036",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23034410/conversions/1776796266-thumbnail.webp",
        title: "Casa 4 dormitorios con cochera",
        description:
          "Casa amplia de dos plantas con cochera y superficie generosa, apta para grupo familiar grande.",
        propertyType: PropertyType.HOUSE,
        squareMeters: 220,
        bedrooms: 4,
        bathrooms: 3,
        price: 1350000,
        acceptsPets: true,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 82,
        acceptedGuarantees: [GuaranteeType.MORTGAGE],
      },
      {
        sourceTitle: "Montevideo 630 - Departamento De 1 Dormitorio En Alquiler - Martin, Rosario",
        sourceAddress: "Montevideo 630",
        sourceImageUrl:
          "https://d1v2p1s05qqabi.cloudfront.net/23031054/conversions/1776792687-thumbnail.webp",
        title: "Departamento 1 dormitorio moderno",
        description:
          "Departamento con cocina semi integrada y balcón, inspirado en avisos recientes del sitio de referencia.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 42,
        bedrooms: 1,
        bathrooms: 1,
        price: 480000,
        expenses: 103000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: false,
        targetTrustScore: 61,
        acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
      },
    ],
    propertiesPerAgency: 3,
  },
  uno: {
    key: "uno",
    referenceUrl: "https://www.uno-propiedades.com.ar/alquiler_propiedades_rosario",
    referenceNote:
      "Basado en el listado público de alquileres de UNO Propiedades Rosario; se completan campos faltantes para que validen en el sistema.",
    agencies: [
      {
        companyName: "UNO Centro Ejecutivo",
        companySlug: "uno-centro-ejecutivo",
        companyTaxId: "30-72000001-8",
        phone: "3414302201",
        email: "centro@uno-demo.ar",
        firstName: "Hugo",
        lastName: "Levit",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Centro",
      },
      {
        companyName: "UNO Río Premium",
        companySlug: "uno-rio-premium",
        companyTaxId: "30-72000002-6",
        phone: "3414302202",
        email: "rio@uno-demo.ar",
        firstName: "Marina",
        lastName: "Acosta",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Zona Río",
      },
      {
        companyName: "UNO Lourdes Gestión",
        companySlug: "uno-lourdes-gestion",
        companyTaxId: "30-72000003-4",
        phone: "3414302203",
        email: "lourdes@uno-demo.ar",
        firstName: "Sofía",
        lastName: "Fabbri",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Lourdes",
      },
      {
        companyName: "UNO Echesortu Urbano",
        companySlug: "uno-echesortu-urbano",
        companyTaxId: "30-72000004-2",
        phone: "3414302204",
        email: "echesortu@uno-demo.ar",
        firstName: "Ramiro",
        lastName: "Pérez",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Echesortu",
      },
      {
        companyName: "UNO Pichincha Select",
        companySlug: "uno-pichincha-select",
        companyTaxId: "30-72000005-0",
        phone: "3414302205",
        email: "pichincha@uno-demo.ar",
        firstName: "Julieta",
        lastName: "Rinaldi",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Pichincha",
      },
      {
        companyName: "UNO Arroyito Casas",
        companySlug: "uno-arroyito-casas",
        companyTaxId: "30-72000006-9",
        phone: "3414302206",
        email: "arroyito@uno-demo.ar",
        firstName: "Matías",
        lastName: "Silva",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Arroyito",
      },
      {
        companyName: "UNO Abasto Alquileres",
        companySlug: "uno-abasto-alquileres",
        companyTaxId: "30-72000007-7",
        phone: "3414302207",
        email: "abasto@uno-demo.ar",
        firstName: "Camila",
        lastName: "Nadal",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Abasto",
      },
      {
        companyName: "UNO República Sexta",
        companySlug: "uno-republica-sexta",
        companyTaxId: "30-72000008-5",
        phone: "3414302208",
        email: "sexta@uno-demo.ar",
        firstName: "Bruno",
        lastName: "Ledesma",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "República de la Sexta",
      },
      {
        companyName: "UNO Funes Residencial",
        companySlug: "uno-funes-residencial",
        companyTaxId: "30-72000009-3",
        phone: "3414302209",
        email: "funes@uno-demo.ar",
        firstName: "Natalia",
        lastName: "Cejas",
        city: "Funes",
        province: "Santa Fe",
        neighborhood: "Funes",
      },
      {
        companyName: "UNO Fisherton Norte",
        companySlug: "uno-fisherton-norte",
        companyTaxId: "30-72000010-7",
        phone: "3414302210",
        email: "fisherton@uno-demo.ar",
        firstName: "Franco",
        lastName: "Quiroga",
        city: "Rosario",
        province: "Santa Fe",
        neighborhood: "Fisherton",
      },
    ],
    templates: [
      {
        sourceTitle: "local en alquiler en rosario Pte Roca 601 PB",
        sourceAddress: "Pte. Roca 601",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.23057.19_thum.jpg",
        title: "Local comercial en esquina",
        description:
          "Local amplio en esquina con alto tránsito, inspirado en el catálogo público de UNO Propiedades.",
        propertyType: PropertyType.COMMERCIAL,
        squareMeters: 280,
        bedrooms: 1,
        bathrooms: 2,
        price: 6000000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: false,
        targetTrustScore: 90,
        acceptedGuarantees: [GuaranteeType.MORTGAGE],
      },
      {
        sourceTitle: "dpto de 3 dormitorios en alquiler en rosario Belgrano 733 PISO 6",
        sourceAddress: "Belgrano 733",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.18395.0_thum.jpg",
        title: "Piso 3 dormitorios con vista al río",
        description:
          "Piso exclusivo con balcón, cochera y vista abierta, adaptado para propiedades premium del sistema.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 185,
        bedrooms: 3,
        bathrooms: 4,
        price: 2400000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 86,
        acceptedGuarantees: [GuaranteeType.MORTGAGE],
        preferredProfile: "EMPLOYED",
      },
      {
        sourceTitle: "casa de 5 dormitorios en alquiler en rosario Moreno 338 PB",
        sourceAddress: "Moreno 338",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.19264.0_thum.jpg",
        title: "Casa 5 dormitorios apta uso mixto",
        description:
          "Casa con patios y terraza, válida tanto para familia como para uso institucional liviano.",
        propertyType: PropertyType.HOUSE,
        squareMeters: 208,
        bedrooms: 5,
        bathrooms: 3,
        price: 1950000,
        acceptsPets: true,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 84,
        acceptedGuarantees: [GuaranteeType.MORTGAGE],
      },
      {
        sourceTitle: "dpto de 3 dormitorios en alquiler en rosario Salta 1677 PISO 8",
        sourceAddress: "Salta 1677",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.24178.1_thum.jpg",
        title: "Departamento 3 dormitorios con cochera",
        description:
          "Departamento externo con cochera incluida y equipamiento central, pensado para grupo familiar consolidado.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 82,
        bedrooms: 3,
        bathrooms: 3,
        price: 1480000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 80,
        acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "dpto de 2 dormitorios en alquiler en rosario Wheelwright 1421 PISO 6",
        sourceAddress: "Wheelwright 1421",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.29183.1_thum.jpg",
        title: "Departamento 2 dormitorios frente al río",
        description:
          "Unidad externa con balcón y vista abierta, orientada a perfiles con score medio-alto.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 60,
        bedrooms: 2,
        bathrooms: 1,
        price: 600000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: true,
        targetTrustScore: 69,
        acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "casa de 2 dormitorios en alquiler en rosario Peru 3139 PISO 1",
        sourceAddress: "Perú 3139",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.27274.8_thum.jpg",
        title: "Casa de pasillo 2 dormitorios con terraza",
        description:
          "Casa en planta alta con patio, terraza y parrillero, armada para mostrar variedad de tipologías.",
        propertyType: PropertyType.HOUSE,
        squareMeters: 95,
        bedrooms: 2,
        bathrooms: 1,
        price: 600000,
        acceptsPets: true,
        acceptsSmokers: true,
        acceptsChildren: true,
        targetTrustScore: 62,
        acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "dpto de 1 dormitorio en alquiler en rosario San Juan 1461 PISO 5",
        sourceAddress: "San Juan 1461",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.23970.0_thum.jpg",
        title: "Semipiso 1 dormitorio orientado al norte",
        description:
          "Semipiso externo con balcón, cocina integrada y baño completo. Ideal para un ocupante o pareja.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 40,
        bedrooms: 1,
        bathrooms: 1,
        price: 585000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: false,
        targetTrustScore: 63,
        acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "dpto de 1 dormitorio en alquiler en rosario Mitre 529 PISO 7",
        sourceAddress: "Mitre 529",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.4541.0_thum.jpg",
        title: "Departamento 1 dormitorio con amenities",
        description:
          "Departamento con balcón terraza, cochera y amenities, útil para el segmento más premium del demo.",
        propertyType: PropertyType.APARTMENT,
        squareMeters: 52,
        bedrooms: 1,
        bathrooms: 1,
        price: 560000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: false,
        targetTrustScore: 67,
        acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "oficina en alquiler en rosario San Martín 862 PISO 4",
        sourceAddress: "San Martín 862",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.27257.5_thum.jpg",
        title: "Oficina con recepción y despachos",
        description:
          "Oficina en galería con recepción, privados y baño propio, incorporada para cubrir el caso comercial.",
        propertyType: PropertyType.OFFICE,
        squareMeters: 95,
        bedrooms: 1,
        bathrooms: 1,
        price: 450000,
        acceptsPets: false,
        acceptsSmokers: false,
        acceptsChildren: false,
        targetTrustScore: 74,
        acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
      },
      {
        sourceTitle: "dpto monoambiente en alquiler en rosario Zeballos 2017 PISO 8",
        sourceAddress: "Zeballos 2017",
        sourceImageUrl: "https://cdn.uno-propiedades.com.ar/img/P.22121.0_thum.jpg",
        title: "Monoambiente semipiso en zona centro",
        description:
          "Monoambiente externo y luminoso, útil para expandir el catálogo de tickets bajos a medios.",
        propertyType: PropertyType.STUDIO,
        squareMeters: 30,
        bedrooms: 1,
        bathrooms: 1,
        price: 380000,
        acceptsPets: false,
        acceptsSmokers: true,
        acceptsChildren: false,
        targetTrustScore: 50,
        acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
      },
    ],
    propertiesPerAgency: 3,
  },
};

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = normalizedValue;
    }
  }
}

function ensureEnvLoaded() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, ".env"));
  loadEnvFile(path.join(cwd, ".env.local"));
}

function hasConfiguredEnvValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim();

  if (!normalized) {
    return false;
  }

  return !new Set([
    "TU_ANON_KEY",
    "TU_SERVICE_ROLE_KEY",
    "your-anon-key",
    "your-service-role-key",
    "your-project-url",
    "https://your-project.supabase.co",
  ]).has(normalized);
}

function guessExtension(url: string, contentType: string | null) {
  const cleanUrl = url.split("?")[0].toLowerCase();

  if (cleanUrl.endsWith(".webp") || contentType?.includes("webp")) return "webp";
  if (cleanUrl.endsWith(".png") || contentType?.includes("png")) return "png";
  if (cleanUrl.endsWith(".jpeg") || cleanUrl.endsWith(".jpg") || contentType?.includes("jpeg"))
    return "jpg";

  return "bin";
}

async function ensurePropertyPhotosBucket(supabase: SupabaseClient) {
  const { data, error } = await supabase.storage.getBucket(PROPERTY_PHOTOS_BUCKET);

  if (!error && data) {
    return;
  }

  const createResult = await supabase.storage.createBucket(PROPERTY_PHOTOS_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  if (createResult.error && !createResult.error.message.toLowerCase().includes("already exists")) {
    throw new Error(createResult.error.message);
  }
}

async function uploadReferencePhotoToSupabase(input: {
  supabase: SupabaseClient;
  sourceKey: string;
  agencySlug: string;
  propertyIndex: number;
  imageUrl: string;
}) {
  const response = await fetch(input.imageUrl);

  if (!response.ok) {
    throw new Error(`No pude descargar ${input.imageUrl}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type");
  const extension = guessExtension(input.imageUrl, contentType);
  const storagePath = `${input.sourceKey}/${input.agencySlug}/${input.propertyIndex}.${extension}`;
  const fileBuffer = Buffer.from(arrayBuffer);
  const { error } = await input.supabase.storage
    .from(PROPERTY_PHOTOS_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: contentType ?? "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new Error(`No pude subir ${storagePath} a Supabase: ${error.message}`);
  }

  const { data } = input.supabase.storage.from(PROPERTY_PHOTOS_BUCKET).getPublicUrl(storagePath);

  return data.publicUrl;
}

function rotateTemplate(config: SourceConfig, index: number) {
  return config.templates[index % config.templates.length];
}

function normalizeStreetName(address: string) {
  const street = address.replace(/\d.*$/, "").trim();
  return street || "Dirección";
}

function buildAgencyProperties(config: SourceConfig, seed: AgencySeed) {
  const agencyIndex = config.agencies.findIndex((item) => item.companySlug === seed.companySlug);

  return Array.from({ length: config.propertiesPerAgency }, (_, index) => {
    const template = rotateTemplate(config, index + agencyIndex);
    const priceOffset = seed.city === "Rosario" ? 0 : 90000;
    const addressNumber = 400 + index * 120 + agencyIndex * 9;

    return {
      title: `${template.title} - ${seed.neighborhood}`,
      description: `${template.description} ${config.referenceNote}`,
      addressLine: `${normalizeStreetName(template.sourceAddress)} ${addressNumber}`,
      city: seed.city,
      province: seed.province,
      postalCode: "2000",
      propertyType: template.propertyType,
      status: PropertyStatus.PUBLISHED,
      squareMeters: template.squareMeters + index * 3,
      bedrooms: template.bedrooms,
      bathrooms: template.bathrooms,
      price: template.price + priceOffset + index * 25000,
      currency: "ARS",
      expenses: template.expenses ?? null,
      externalUrl: `${config.referenceUrl}?ref=${seed.companySlug}-${index + 1}`,
      photos: [] as string[],
      sourceImageUrl: template.sourceImageUrl,
      targetTrustScore: template.targetTrustScore,
      acceptedGuarantees: template.acceptedGuarantees,
      acceptsPets: template.acceptsPets,
      acceptsSmokers: template.acceptsSmokers,
      acceptsChildren: template.acceptsChildren,
      preferredProfile: template.preferredProfile ?? null,
      compatibilityNotes: `Fuente: ${template.sourceTitle}. Barrio cargado: ${seed.neighborhood}.`,
      publishedAt: new Date().toISOString(),
    };
  });
}

async function getAgencyBySlug(supabase: SupabaseClient, companySlug: string) {
  const { data, error } = await supabase
    .from("User")
    .select("id,companySlug")
    .eq("companySlug", companySlug)
    .maybeSingle();

  if (error) {
    throw new Error(`No pude consultar la agencia ${companySlug}: ${error.message}`);
  }

  return data;
}

async function upsertAgency(supabase: SupabaseClient, seed: AgencySeed) {
  const existing = await getAgencyBySlug(supabase, seed.companySlug);
  const now = new Date().toISOString();
  const payload = {
    firstName: seed.firstName,
    lastName: seed.lastName,
    role: UserRole.AGENCY,
    agencyStatus: AgencyStatus.APPROVED,
    companyName: seed.companyName,
    companySlug: seed.companySlug,
    companyTaxId: seed.companyTaxId,
    email: seed.email,
    phone: seed.phone,
    updatedAt: now,
  };

  if (existing) {
    const { error } = await supabase.from("User").update(payload).eq("id", existing.id);

    if (error) {
      throw new Error(`No pude actualizar la agencia ${seed.companySlug}: ${error.message}`);
    }

    return { id: existing.id, action: "updated" as const };
  }

  const id = randomUUID();
  const { error } = await supabase.from("User").insert({
    id,
    ...payload,
  });

  if (error) {
    throw new Error(`No pude crear la agencia ${seed.companySlug}: ${error.message}`);
  }

  return { id, action: "created" as const };
}

async function findProperty(
  supabase: SupabaseClient,
  agencyId: string,
  title: string,
  addressLine: string
) {
  const { data, error } = await supabase
    .from("Property")
    .select("id")
    .eq("agencyId", agencyId)
    .eq("title", title)
    .eq("addressLine", addressLine)
    .maybeSingle();

  if (error) {
    throw new Error(`No pude consultar la propiedad ${title}: ${error.message}`);
  }

  return data;
}

async function upsertProperty(
  supabase: SupabaseClient,
  agencyId: string,
  property: ReturnType<typeof buildAgencyProperties>[number]
) {
  const { sourceImageUrl: _sourceImageUrl, ...databaseProperty } = property;
  const existing = await findProperty(supabase, agencyId, property.title, property.addressLine);
  const payload = {
    agencyId,
    ...databaseProperty,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase.from("Property").update(payload).eq("id", existing.id);

    if (error) {
      throw new Error(`No pude actualizar la propiedad ${property.title}: ${error.message}`);
    }

    return "updated" as const;
  }

  const { error } = await supabase.from("Property").insert({
    id: randomUUID(),
    ...payload,
  });

  if (error) {
    throw new Error(`No pude crear la propiedad ${property.title}: ${error.message}`);
  }

  return "created" as const;
}

function getSourceConfig() {
  const rawSource = (process.argv[2] ?? process.env.REFERENCE_SOURCE ?? "paganini").toLowerCase();

  if (rawSource !== "paganini" && rawSource !== "uno") {
    throw new Error(`Fuente inválida: ${rawSource}. Usá "paganini" o "uno".`);
  }

  return sourceConfigs[rawSource];
}

async function main() {
  ensureEnvLoaded();

  if (!hasConfiguredEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL real en .env o .env.local.");
  }

  if (!hasConfiguredEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY real en .env o .env.local.");
  }

  const config = getSourceConfig();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  await ensurePropertyPhotosBucket(supabase);

  const summary = [];

  for (const agencySeed of config.agencies) {
    const agency = await upsertAgency(supabase, agencySeed);
    const properties = buildAgencyProperties(config, agencySeed);
    const propertyActions = [];

    for (let index = 0; index < properties.length; index += 1) {
      const property = properties[index];
      const publicPhotoUrl = await uploadReferencePhotoToSupabase({
        supabase,
        sourceKey: config.key,
        agencySlug: agencySeed.companySlug,
        propertyIndex: index + 1,
        imageUrl: property.sourceImageUrl,
      });

      propertyActions.push(
        await upsertProperty(supabase, agency.id, {
          ...property,
          photos: [publicPhotoUrl],
        })
      );
    }

    summary.push({
      agency: agencySeed.companyName,
      agencyAction: agency.action,
      propertyCount: propertyActions.length,
    });
  }

  console.log(`Fuente seleccionada: ${config.key}`);
  console.log(`Referencia: ${config.referenceUrl}`);
  console.log(`Inmobiliarias procesadas: ${summary.length}`);
  console.log(`Propiedades procesadas: ${summary.reduce((count, item) => count + item.propertyCount, 0)}`);

  for (const item of summary) {
    console.log(`- ${item.agency} · ${item.agencyAction} · ${item.propertyCount} propiedades`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
