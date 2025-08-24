import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Candidate } from './entities/candidate.entity';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

const candidatesData = [
    {
        candidateNumber: "01",
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=500&fit=crop&ixlib=rb-4.0.3",
        ketua: { name: "Dr. Evelyn Reed" },
        wakil: { name: "Mr. Samuel Chen" },
        visi: [
            "A future built on sustainable innovation and economic prosperity.",
            "An inclusive society where every voice is heard and valued.",
            "Global leadership in technology and environmental stewardship."
        ],
        misi: [
            "Invest in renewable energy to achieve carbon neutrality by 2040.",
            "Reform education to prioritize critical thinking and digital literacy.",
            "Strengthen international trade agreements to boost local economies.",
            "Ensure affordable and accessible healthcare for all citizens.",
            "Promote transparency and accountability in all government sectors."
        ],
        votes: 0
    },
    {
        candidateNumber: "02",
        imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=400&h=500&fit=crop&ixlib=rb-4.0.3",
        ketua: { name: "Marcus Thorne" },
        wakil: { name: "Isabella Rossi" },
        visi: [
            "A nation defined by its strong communities and resilient infrastructure.",
            "Upholding traditional values while embracing modern progress.",
            "Ensuring security and stability for all families."
        ],
        misi: [
            "Modernize national infrastructure, including transport and digital networks.",
            "Support small businesses through targeted tax cuts and deregulation.",
            "Increase funding for law enforcement and national defense.",
            "Protect national heritage and promote civic pride.",
            "Champion policies that support family values and community engagement."
        ],
        votes: 0
    },
    {
        candidateNumber: "03",
        imageUrl: "https://images.unsplash.com/photo-1600878459498-53b0a5145f1a?q=80&w=400&h=500&fit=crop&ixlib=rb-4.0.3",
        ketua: { name: "Jasmine Kaur" },
        wakil: { name: "Leo Martinez" },
        visi: [
            "A just and equitable society that champions human rights and social progress.",
            "A creative and vibrant culture that celebrates diversity.",
            "Leading the world in humanitarian efforts and diplomatic solutions."
        ],
        misi: [
            "Implement comprehensive social justice reforms.",
            "Expand public funding for the arts and cultural programs.",
            "Increase foreign aid and foster peaceful international relations.",
            "Champion environmental justice for marginalized communities.",
            "Guarantee equal access to education and economic opportunities."
        ],
        votes: 0
    }
];


async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const candidateRepository = app.get<Repository<Candidate>>(getRepositoryToken(Candidate));
    const auditLogRepository = app.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    console.log('Seeding database...');

    console.log('Clearing existing candidates and audit logs...');
    await candidateRepository.clear();
    await auditLogRepository.clear();

    console.log('Inserting new candidate data...');
    await candidateRepository.save(candidatesData);

    console.log('Database seeded successfully!');
    
    await app.close();
    (process as any).exit(0);
}

bootstrap().catch(err => {
    console.error('Seeding failed:', err);
    (process as any).exit(1);
});