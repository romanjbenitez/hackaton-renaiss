import {
  PrismaClient,
  UserRole,
  AgencyStatus,
  TenantProfileType,
  GuaranteeType,
  DocumentType,
  DocumentVerificationStatus,
  PropertyType,
  PropertyStatus,
  CandidacyStatus,
  CandidacySource,
  TransactionStageType,
} from "@prisma/client";

const prisma = new PrismaClient();

const MOCK_PDF_BASE64 = "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKCg==";
const MOCK_IMG_BASE64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=";

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin ───────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@proptech.ar" },
    update: {},
    create: {
      email: "admin@proptech.ar",
      firstName: "Admin",
      lastName: "Plataforma",
      role: UserRole.ADMIN,
    },
  });
  console.log("✓ Admin created");

  // ─── Agencies (2 approved, 1 pending) ────────────────────────────────────
  const [agencyUser1, agencyUser2, agencyUser3] = await Promise.all([
    prisma.user.upsert({
      where: { email: "contacto@remax-palermo.ar" },
      update: {},
      create: {
        email: "contacto@remax-palermo.ar",
        firstName: "Roberto",
        lastName: "Sánchez",
        role: UserRole.AGENCY,
        agencyStatus: AgencyStatus.APPROVED,
        companyName: "RE/MAX Palermo",
        companySlug: "remax-palermo",
        companyTaxId: "30-71234567-0",
        phone: "011 4832-1100",
      },
    }),
    prisma.user.upsert({
      where: { email: "info@inmobiliaria-belgrano.ar" },
      update: {},
      create: {
        email: "info@inmobiliaria-belgrano.ar",
        firstName: "Patricia",
        lastName: "Moreno",
        role: UserRole.AGENCY,
        agencyStatus: AgencyStatus.APPROVED,
        companyName: "Inmobiliaria Belgrano",
        companySlug: "inmobiliaria-belgrano",
        companyTaxId: "30-69876543-2",
        phone: "011 4786-5500",
      },
    }),
    prisma.user.upsert({
      where: { email: "ventas@propiedades-sur.ar" },
      update: {},
      create: {
        email: "ventas@propiedades-sur.ar",
        firstName: "Diego",
        lastName: "Álvarez",
        role: UserRole.AGENCY,
        agencyStatus: AgencyStatus.PENDING,
        companyName: "Propiedades del Sur",
        companySlug: "propiedades-del-sur",
        companyTaxId: "30-65432198-5",
        phone: "011 4305-2200",
      },
    }),
  ]);
  console.log("✓ 3 agencies created (2 approved, 1 pending)");

  // ─── Tenants (20 with varied profiles and scores) ────────────────────────
  type TenantSeed = {
    email: string;
    firstName: string;
    lastName: string;
    dni: string;
    profileType: TenantProfileType;
    guaranteeType: GuaranteeType;
    hasPets: boolean;
    isSmoker: boolean;
    familyMembers: number;
    trustScore: number;
    monthlyIncome: number;
  };

  const tenantSeeds: TenantSeed[] = [
    {
      email: "lucas.garcia@gmail.com",
      firstName: "Lucas",
      lastName: "García",
      dni: "35123456",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.CAUTION_INSURANCE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 1,
      trustScore: 87,
      monthlyIncome: 850000,
    },
    {
      email: "maria.lopez@gmail.com",
      firstName: "María",
      lastName: "López",
      dni: "30987654",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: true,
      isSmoker: false,
      familyMembers: 3,
      trustScore: 92,
      monthlyIncome: 1200000,
    },
    {
      email: "carlos.mendez@hotmail.com",
      firstName: "Carlos",
      lastName: "Méndez",
      dni: "28765432",
      profileType: TenantProfileType.MONOTRIBUTISTA,
      guaranteeType: GuaranteeType.CAUTION_INSURANCE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 2,
      trustScore: 71,
      monthlyIncome: 650000,
    },
    {
      email: "ana.rodriguez@gmail.com",
      firstName: "Ana",
      lastName: "Rodríguez",
      dni: "33456789",
      profileType: TenantProfileType.SELF_EMPLOYED,
      guaranteeType: GuaranteeType.NONE,
      hasPets: true,
      isSmoker: true,
      familyMembers: 1,
      trustScore: 54,
      monthlyIncome: 480000,
    },
    {
      email: "martin.fernandez@yahoo.com",
      firstName: "Martín",
      lastName: "Fernández",
      dni: "36789012",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 2,
      trustScore: 95,
      monthlyIncome: 1800000,
    },
    {
      email: "julia.sanchez@gmail.com",
      firstName: "Julia",
      lastName: "Sánchez",
      dni: "31234567",
      profileType: TenantProfileType.RETIRED,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 1,
      trustScore: 78,
      monthlyIncome: 550000,
    },
    {
      email: "diego.martinez@gmail.com",
      firstName: "Diego",
      lastName: "Martínez",
      dni: "34567890",
      profileType: TenantProfileType.MONOTRIBUTISTA,
      guaranteeType: GuaranteeType.CAUTION_INSURANCE,
      hasPets: true,
      isSmoker: false,
      familyMembers: 4,
      trustScore: 62,
      monthlyIncome: 700000,
    },
    {
      email: "valentina.gomez@hotmail.com",
      firstName: "Valentina",
      lastName: "Gómez",
      dni: "37890123",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.CAUTION_INSURANCE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 1,
      trustScore: 83,
      monthlyIncome: 950000,
    },
    {
      email: "sebastian.torres@gmail.com",
      firstName: "Sebastián",
      lastName: "Torres",
      dni: "29012345",
      profileType: TenantProfileType.SELF_EMPLOYED,
      guaranteeType: GuaranteeType.NONE,
      hasPets: false,
      isSmoker: true,
      familyMembers: 1,
      trustScore: 45,
      monthlyIncome: 420000,
    },
    {
      email: "camila.diaz@gmail.com",
      firstName: "Camila",
      lastName: "Díaz",
      dni: "38123456",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 2,
      trustScore: 90,
      monthlyIncome: 1400000,
    },
    {
      email: "nicolas.herrera@gmail.com",
      firstName: "Nicolás",
      lastName: "Herrera",
      dni: "32345678",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.CAUTION_INSURANCE,
      hasPets: true,
      isSmoker: false,
      familyMembers: 3,
      trustScore: 76,
      monthlyIncome: 880000,
    },
    {
      email: "paula.ruiz@yahoo.com",
      firstName: "Paula",
      lastName: "Ruiz",
      dni: "35678901",
      profileType: TenantProfileType.MONOTRIBUTISTA,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 1,
      trustScore: 68,
      monthlyIncome: 620000,
    },
    {
      email: "andres.morales@gmail.com",
      firstName: "Andrés",
      lastName: "Morales",
      dni: "27890123",
      profileType: TenantProfileType.RETIRED,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 2,
      trustScore: 82,
      monthlyIncome: 500000,
    },
    {
      email: "florencia.jimenez@gmail.com",
      firstName: "Florencia",
      lastName: "Jiménez",
      dni: "39012345",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.CAUTION_INSURANCE,
      hasPets: true,
      isSmoker: false,
      familyMembers: 1,
      trustScore: 73,
      monthlyIncome: 760000,
    },
    {
      email: "gonzalo.alvarez@hotmail.com",
      firstName: "Gonzalo",
      lastName: "Álvarez",
      dni: "33901234",
      profileType: TenantProfileType.SELF_EMPLOYED,
      guaranteeType: GuaranteeType.NONE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 1,
      trustScore: 38,
      monthlyIncome: 380000,
    },
    {
      email: "sofia.vargas@gmail.com",
      firstName: "Sofía",
      lastName: "Vargas",
      dni: "36012345",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 2,
      trustScore: 88,
      monthlyIncome: 1100000,
    },
    {
      email: "javier.castillo@gmail.com",
      firstName: "Javier",
      lastName: "Castillo",
      dni: "30123456",
      profileType: TenantProfileType.MONOTRIBUTISTA,
      guaranteeType: GuaranteeType.CAUTION_INSURANCE,
      hasPets: false,
      isSmoker: true,
      familyMembers: 1,
      trustScore: 57,
      monthlyIncome: 580000,
    },
    {
      email: "natalia.ramos@gmail.com",
      firstName: "Natalia",
      lastName: "Ramos",
      dni: "34234567",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: true,
      isSmoker: false,
      familyMembers: 3,
      trustScore: 94,
      monthlyIncome: 1600000,
    },
    {
      email: "emilio.reyes@yahoo.com",
      firstName: "Emilio",
      lastName: "Reyes",
      dni: "31345678",
      profileType: TenantProfileType.RETIRED,
      guaranteeType: GuaranteeType.CAUTION_INSURANCE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 1,
      trustScore: 66,
      monthlyIncome: 450000,
    },
    {
      email: "agustina.flores@gmail.com",
      firstName: "Agustina",
      lastName: "Flores",
      dni: "37456789",
      profileType: TenantProfileType.EMPLOYED,
      guaranteeType: GuaranteeType.MORTGAGE,
      hasPets: false,
      isSmoker: false,
      familyMembers: 2,
      trustScore: 79,
      monthlyIncome: 920000,
    },
  ];

  const profiles: { id: string; trustScore: number; guaranteeType: GuaranteeType }[] = [];

  for (const seed of tenantSeeds) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: {
        email: seed.email,
        firstName: seed.firstName,
        lastName: seed.lastName,
        role: UserRole.TENANT,
      },
    });

    const profile = await prisma.tenantProfile.upsert({
      where: { userId: user.id },
      update: { trustScore: seed.trustScore },
      create: {
        userId: user.id,
        dni: seed.dni,
        profileType: seed.profileType,
        monthlyIncome: seed.monthlyIncome,
        guaranteeType: seed.guaranteeType,
        hasPets: seed.hasPets,
        isSmoker: seed.isSmoker,
        familyMembers: seed.familyMembers,
        trustScore: seed.trustScore,
        onboardingCompletedAt: new Date(),
      },
    });

    // DNI document
    await prisma.document.create({
      data: {
        tenantProfileId: profile.id,
        uploadedByUserId: user.id,
        type: DocumentType.DNI,
        displayName: "DNI",
        fileName: `dni_${seed.dni}.pdf`,
        mimeType: "application/pdf",
        base64Data: MOCK_PDF_BASE64,
        verificationStatus: DocumentVerificationStatus.VERIFIED,
      },
    });

    // Income document — flag low-score ones
    const isFlagged = seed.trustScore < 50;
    await prisma.document.create({
      data: {
        tenantProfileId: profile.id,
        uploadedByUserId: user.id,
        type: DocumentType.PAYSLIP,
        displayName: "Recibo de sueldo",
        fileName: "recibo_sueldo.pdf",
        mimeType: "application/pdf",
        base64Data: MOCK_PDF_BASE64,
        verificationStatus: isFlagged
          ? DocumentVerificationStatus.FLAGGED
          : DocumentVerificationStatus.VERIFIED,
        suspicious: isFlagged,
        suspiciousReason: isFlagged ? "Inconsistencia detectada en el monto declarado" : null,
        suspiciousScore: isFlagged ? 0.82 : null,
      },
    });

    profiles.push({
      id: profile.id,
      trustScore: seed.trustScore,
      guaranteeType: seed.guaranteeType,
    });
  }
  console.log("✓ 20 tenants with profiles and documents created");

  // ─── Properties ───────────────────────────────────────────────────────────
  type PropertySeed = {
    agencyId: string;
    title: string;
    addressLine: string;
    city: string;
    province: string;
    propertyType: PropertyType;
    status: PropertyStatus;
    squareMeters: number;
    bedrooms: number;
    bathrooms: number;
    price: number;
    acceptsPets: boolean;
    acceptsSmokers: boolean;
    targetTrustScore: number;
    acceptedGuarantees: GuaranteeType[];
  };

  const propertySeedData: PropertySeed[] = [
    {
      agencyId: agencyUser1.id,
      title: "Depto 2 ambientes en Palermo Soho",
      addressLine: "Thames 1234 3°B",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 55,
      bedrooms: 2,
      bathrooms: 1,
      price: 350000,
      acceptsPets: false,
      acceptsSmokers: false,
      targetTrustScore: 70,
      acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
    },
    {
      agencyId: agencyUser1.id,
      title: "Depto 3 amb con balcón en Palermo Hollywood",
      addressLine: "Uriarte 2345 1°A",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 80,
      bedrooms: 3,
      bathrooms: 2,
      price: 480000,
      acceptsPets: true,
      acceptsSmokers: false,
      targetTrustScore: 65,
      acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
    },
    {
      agencyId: agencyUser1.id,
      title: "Monoambiente coqueto en Palermo",
      addressLine: "Cabrera 3456 PB",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.STUDIO,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 35,
      bedrooms: 1,
      bathrooms: 1,
      price: 220000,
      acceptsPets: false,
      acceptsSmokers: true,
      targetTrustScore: 50,
      acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
    },
    {
      agencyId: agencyUser2.id,
      title: "Depto 4 amb premium en Belgrano R",
      addressLine: "Virrey del Pino 4567 5°C",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 100,
      bedrooms: 4,
      bathrooms: 2,
      price: 650000,
      acceptsPets: false,
      acceptsSmokers: false,
      targetTrustScore: 80,
      acceptedGuarantees: [GuaranteeType.MORTGAGE],
    },
    {
      agencyId: agencyUser2.id,
      title: "3 ambientes con cochera en Belgrano",
      addressLine: "Juramento 5678 2°B",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 65,
      bedrooms: 3,
      bathrooms: 1,
      price: 420000,
      acceptsPets: true,
      acceptsSmokers: false,
      targetTrustScore: 60,
      acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
    },
    {
      agencyId: agencyUser2.id,
      title: "2 ambientes luminoso en Belgrano",
      addressLine: "Cabildo 6789 1°A",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 48,
      bedrooms: 2,
      bathrooms: 1,
      price: 290000,
      acceptsPets: false,
      acceptsSmokers: false,
      targetTrustScore: 55,
      acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
    },
    {
      agencyId: agencyUser1.id,
      title: "Depto 3 amb reciclado en Palermo",
      addressLine: "Honduras 7890 3°D",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 72,
      bedrooms: 3,
      bathrooms: 2,
      price: 450000,
      acceptsPets: true,
      acceptsSmokers: false,
      targetTrustScore: 70,
      acceptedGuarantees: [GuaranteeType.MORTGAGE, GuaranteeType.CAUTION_INSURANCE],
    },
    {
      agencyId: agencyUser2.id,
      title: "Casa con jardín en Belgrano",
      addressLine: "Vuelta de Obligado 8901 PB",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.HOUSE,
      status: PropertyStatus.RENTED,
      squareMeters: 180,
      bedrooms: 4,
      bathrooms: 3,
      price: 900000,
      acceptsPets: true,
      acceptsSmokers: false,
      targetTrustScore: 75,
      acceptedGuarantees: [GuaranteeType.MORTGAGE],
    },
    {
      agencyId: agencyUser3.id,
      title: "2 ambientes en San Telmo",
      addressLine: "Estados Unidos 9012 2°C",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.APARTMENT,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 45,
      bedrooms: 2,
      bathrooms: 1,
      price: 260000,
      acceptsPets: false,
      acceptsSmokers: true,
      targetTrustScore: 40,
      acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE, GuaranteeType.NONE],
    },
    {
      agencyId: agencyUser3.id,
      title: "Monoambiente en casco histórico San Telmo",
      addressLine: "Defensa 1234 1°B",
      city: "Buenos Aires",
      province: "CABA",
      propertyType: PropertyType.STUDIO,
      status: PropertyStatus.PUBLISHED,
      squareMeters: 30,
      bedrooms: 1,
      bathrooms: 1,
      price: 190000,
      acceptsPets: false,
      acceptsSmokers: false,
      targetTrustScore: 45,
      acceptedGuarantees: [GuaranteeType.CAUTION_INSURANCE],
    },
  ];

  const properties = await Promise.all(
    propertySeedData.map((data) =>
      prisma.property.create({
        data: {
          ...data,
          price: data.price,
          photos: [MOCK_IMG_BASE64],
          description:
            `Hermosa propiedad ubicada en ${data.city}. ${data.acceptsPets ? "Acepta mascotas." : ""} ${data.acceptsSmokers ? "Acepta fumadores." : ""}`.trim(),
        },
      })
    )
  );

  const now = Date.now();
  await Promise.all(
    properties.map((property, index) => {
      const isRemaxProperty = property.agencyId === agencyUser1.id;
      const offsetMinutes = isRemaxProperty ? index : 120 + index;

      return prisma.property.update({
        where: { id: property.id },
        data: {
          createdAt: new Date(now - offsetMinutes * 60_000),
        },
      });
    })
  );
  console.log("✓ 10 properties created");

  // ─── Candidacies & Transactions ───────────────────────────────────────────
  type CandidacySeed = {
    propertyIdx: number;
    profileIdx: number;
    status: CandidacyStatus;
    aiScore?: number;
    aiExplanation?: string;
    transactionStage?: TransactionStageType;
  };

  const candidacySeeds: CandidacySeed[] = [
    {
      propertyIdx: 0,
      profileIdx: 0,
      status: CandidacyStatus.SELECTED,
      aiScore: 82,
      aiExplanation:
        "Perfil compatible. Buen score y garantía sólida. Sin mascotas según restricción.",
      transactionStage: TransactionStageType.DOCS_COMPLETE,
    },
    {
      propertyIdx: 0,
      profileIdx: 2,
      status: CandidacyStatus.IN_REVIEW,
      aiScore: 65,
      aiExplanation:
        "Compatibilidad moderada. Monotributista con ingresos ajustados al precio solicitado.",
    },
    {
      propertyIdx: 1,
      profileIdx: 1,
      status: CandidacyStatus.SELECTED,
      aiScore: 91,
      aiExplanation: "Alta compatibilidad. Acepta mascotas, familia de 3 compatible con el tamaño.",
      transactionStage: TransactionStageType.CONTRACT_REVIEW,
    },
    {
      propertyIdx: 1,
      profileIdx: 6,
      status: CandidacyStatus.SUBMITTED,
      aiScore: 58,
      aiExplanation: "Familia grande para el inmueble. Score moderado.",
    },
    {
      propertyIdx: 2,
      profileIdx: 3,
      status: CandidacyStatus.SELECTED,
      aiScore: 72,
      aiExplanation: "Acepta fumadores. Score bajo pero garantía cubierta.",
      transactionStage: TransactionStageType.CONTRACT_SIGNED,
    },
    {
      propertyIdx: 3,
      profileIdx: 4,
      status: CandidacyStatus.SELECTED,
      aiScore: 97,
      aiExplanation: "Perfil excelente. Score 95, garantía hipotecaria, pareja sin mascotas.",
      transactionStage: TransactionStageType.KEYS_DELIVERED,
    },
    {
      propertyIdx: 3,
      profileIdx: 9,
      status: CandidacyStatus.REJECTED,
      aiScore: 79,
      aiExplanation: "Buen perfil pero score por debajo del mínimo requerido (80).",
    },
    {
      propertyIdx: 4,
      profileIdx: 10,
      status: CandidacyStatus.SUBMITTED,
      aiScore: 74,
      aiExplanation: "Compatible. Familia con mascotas aceptada. Score bueno.",
    },
    {
      propertyIdx: 5,
      profileIdx: 7,
      status: CandidacyStatus.SELECTED,
      aiScore: 83,
      aiExplanation: "Perfil sólido. Empleada en relación de dependencia, seguro de caución.",
      transactionStage: TransactionStageType.CANDIDATE_SELECTED,
    },
    {
      propertyIdx: 6,
      profileIdx: 17,
      status: CandidacyStatus.SHORTLISTED,
      aiScore: 93,
      aiExplanation: "Excelente compatibilidad. Score muy alto, garantía hipotecaria.",
    },
    {
      propertyIdx: 6,
      profileIdx: 1,
      status: CandidacyStatus.SUBMITTED,
      aiScore: 88,
      aiExplanation: "Alta compatibilidad. Acepta mascotas, familia compatible.",
    },
    {
      propertyIdx: 7,
      profileIdx: 4,
      status: CandidacyStatus.SELECTED,
      aiScore: 89,
      aiExplanation: "Casa amplia compatible con perfil de pareja.",
      transactionStage: TransactionStageType.KEYS_DELIVERED,
    },
    {
      propertyIdx: 8,
      profileIdx: 3,
      status: CandidacyStatus.SELECTED,
      aiScore: 71,
      aiExplanation: "Score bajo pero la propiedad acepta rangos bajos.",
      transactionStage: TransactionStageType.DOCS_COMPLETE,
    },
    {
      propertyIdx: 9,
      profileIdx: 14,
      status: CandidacyStatus.SUBMITTED,
      aiScore: 45,
      aiExplanation: "Score muy bajo. Riesgo alto según perfil.",
    },
    {
      propertyIdx: 2,
      profileIdx: 16,
      status: CandidacyStatus.IN_REVIEW,
      aiScore: 62,
      aiExplanation: "Fumador compatible con la propiedad. Score regular.",
    },
  ];

  for (const seed of candidacySeeds) {
    const property = properties[seed.propertyIdx];
    const profile = profiles[seed.profileIdx];
    if (!property || !profile) continue;

    const candidacy = await prisma.candidacy.create({
      data: {
        propertyId: property.id,
        tenantProfileId: profile.id,
        source: CandidacySource.PLATFORM,
        status: seed.status,
        scoreAtSubmission: profile.trustScore,
        guaranteeType: profile.guaranteeType,
        aiCompatibilityScore: seed.aiScore,
        aiCompatibilityExplanation: seed.aiExplanation,
        aiCompatibilityMatchPoints:
          seed.aiScore && seed.aiScore > 70 ? ["Score adecuado", "Documentación completa"] : [],
        aiCompatibilityConflicts:
          seed.aiScore && seed.aiScore < 70 ? ["Score por debajo del ideal"] : [],
      },
    });

    if (seed.transactionStage) {
      const transaction = await prisma.transaction.create({
        data: {
          propertyId: property.id,
          candidacyId: candidacy.id,
          currentStage: seed.transactionStage,
          ownerEmail: "propietario@example.com",
          ownerName: "Propietario Ejemplo",
        },
      });

      // Add initial state record
      await prisma.transactionState.create({
        data: {
          transactionId: transaction.id,
          stage: seed.transactionStage,
          isCurrent: true,
          note: "Estado inicial",
        },
      });
    }
  }
  console.log("✓ 15 candidacies and transactions created");

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
