-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TENANT', 'AGENCY', 'ADMIN');

-- CreateEnum
CREATE TYPE "AgencyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TenantProfileType" AS ENUM ('EMPLOYED', 'MONOTRIBUTISTA', 'SELF_EMPLOYED', 'RETIRED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'PAYSLIP', 'MONOTRIBUTO_CERTIFICATE', 'MONOTRIBUTO_PAYMENT', 'INCOME_AFFIDAVIT', 'RETIREMENT_RECEIPT', 'MORTGAGE_GUARANTEE', 'CAUTION_INSURANCE', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "GuaranteeType" AS ENUM ('MORTGAGE', 'CAUTION_INSURANCE', 'NONE');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'PH', 'STUDIO', 'OFFICE', 'COMMERCIAL', 'LAND', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'RENTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CandidacyStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CandidacySource" AS ENUM ('PLATFORM', 'MANUAL');

-- CreateEnum
CREATE TYPE "TransactionStageType" AS ENUM ('CANDIDATE_SELECTED', 'DOCS_COMPLETE', 'CONTRACT_REVIEW', 'CONTRACT_SIGNED', 'KEYS_DELIVERED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "agencyStatus" "AgencyStatus",
    "companyName" TEXT,
    "companySlug" TEXT,
    "companyTaxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "profileType" "TenantProfileType" NOT NULL,
    "occupation" TEXT,
    "monthlyIncome" DECIMAL(12,2),
    "verazScore" INTEGER,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "trustScoreExplanation" TEXT,
    "improvementSuggestion" TEXT,
    "profileSummary" TEXT,
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "isSmoker" BOOLEAN NOT NULL DEFAULT false,
    "familyMembers" INTEGER NOT NULL DEFAULT 1,
    "hasChildren" BOOLEAN NOT NULL DEFAULT false,
    "guaranteeType" "GuaranteeType" NOT NULL DEFAULT 'NONE',
    "guaranteeDetails" TEXT,
    "platformHistoryScore" INTEGER,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantProfileId" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "type" "DocumentType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT,
    "url" TEXT,
    "base64Data" TEXT,
    "verificationStatus" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspiciousReason" TEXT,
    "suspiciousScore" DOUBLE PRECISION,
    "visibleToClient" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "squareMeters" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "expenses" DECIMAL(12,2),
    "externalUrl" TEXT,
    "photos" TEXT[],
    "targetTrustScore" INTEGER,
    "acceptedGuarantees" "GuaranteeType"[],
    "acceptsPets" BOOLEAN NOT NULL DEFAULT false,
    "acceptsSmokers" BOOLEAN NOT NULL DEFAULT false,
    "acceptsChildren" BOOLEAN NOT NULL DEFAULT true,
    "preferredProfile" "TenantProfileType",
    "compatibilityNotes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidacy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tenantProfileId" TEXT,
    "propertyId" TEXT NOT NULL,
    "status" "CandidacyStatus" NOT NULL DEFAULT 'SUBMITTED',
    "source" "CandidacySource" NOT NULL DEFAULT 'PLATFORM',
    "scoreAtSubmission" INTEGER NOT NULL,
    "monthlyIncome" DECIMAL(12,2),
    "rentToIncomeRatio" DOUBLE PRECISION,
    "guaranteeType" "GuaranteeType",
    "aiCompatibilityScore" INTEGER,
    "aiCompatibilityExplanation" TEXT,
    "aiCompatibilityMatchPoints" TEXT[],
    "aiCompatibilityConflicts" TEXT[],
    "manualCandidateName" TEXT,
    "manualCandidateEmail" TEXT,
    "manualCandidatePhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "candidacyId" TEXT NOT NULL,
    "currentStage" "TransactionStageType" NOT NULL DEFAULT 'CANDIDATE_SELECTED',
    "shareToken" TEXT NOT NULL,
    "clientEmail" TEXT,
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionState" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "stage" "TransactionStageType" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionNote" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "visibleToClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDocument" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "stage" "TransactionStageType" NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT,
    "storageKey" TEXT,
    "visibleToClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_companySlug_key" ON "User"("companySlug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantProfile_userId_key" ON "TenantProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantProfile_dni_key" ON "TenantProfile"("dni");

-- CreateIndex
CREATE INDEX "TenantProfile_trustScore_idx" ON "TenantProfile"("trustScore");

-- CreateIndex
CREATE INDEX "TenantProfile_profileType_idx" ON "TenantProfile"("profileType");

-- CreateIndex
CREATE INDEX "Document_tenantProfileId_type_idx" ON "Document"("tenantProfileId", "type");

-- CreateIndex
CREATE INDEX "Document_verificationStatus_idx" ON "Document"("verificationStatus");

-- CreateIndex
CREATE INDEX "Property_agencyId_status_idx" ON "Property"("agencyId", "status");

-- CreateIndex
CREATE INDEX "Property_city_status_idx" ON "Property"("city", "status");

-- CreateIndex
CREATE INDEX "Candidacy_propertyId_status_idx" ON "Candidacy"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Candidacy_tenantProfileId_idx" ON "Candidacy"("tenantProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_property_unique" ON "Candidacy"("tenantId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_candidacyId_key" ON "Transaction"("candidacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_shareToken_key" ON "Transaction"("shareToken");

-- CreateIndex
CREATE INDEX "Transaction_propertyId_currentStage_idx" ON "Transaction"("propertyId", "currentStage");

-- CreateIndex
CREATE INDEX "Transaction_shareToken_idx" ON "Transaction"("shareToken");

-- CreateIndex
CREATE INDEX "TransactionState_transactionId_stage_idx" ON "TransactionState"("transactionId", "stage");

-- CreateIndex
CREATE INDEX "TransactionState_transactionId_isCurrent_idx" ON "TransactionState"("transactionId", "isCurrent");

-- CreateIndex
CREATE INDEX "TransactionNote_transactionId_visibleToClient_idx" ON "TransactionNote"("transactionId", "visibleToClient");

-- CreateIndex
CREATE INDEX "TransactionDocument_transactionId_stage_idx" ON "TransactionDocument"("transactionId", "stage");

-- AddForeignKey
ALTER TABLE "TenantProfile" ADD CONSTRAINT "TenantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidacy" ADD CONSTRAINT "Candidacy_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidacy" ADD CONSTRAINT "Candidacy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidacy" ADD CONSTRAINT "Candidacy_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_candidacyId_fkey" FOREIGN KEY ("candidacyId") REFERENCES "Candidacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionState" ADD CONSTRAINT "TransactionState_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionState" ADD CONSTRAINT "TransactionState_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionNote" ADD CONSTRAINT "TransactionNote_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionNote" ADD CONSTRAINT "TransactionNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
