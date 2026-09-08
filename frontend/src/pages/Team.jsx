import { Page, Reveal } from "../components/motion";
import Seo from "../components/site/Seo";
import { BRAND } from "../lib/site";

const TEAM = [
    {
        name: "Tracie Culver",
        role: "Broker / Owner / Realtor / GRISRES Property Manager",
        photo: "/api/uploads/seed/team-tracie.jpeg",
        bio: [
            "Tracie Culver is the Broker and Owner of Culver Realty & Property Management, where she has built a reputation for combining professionalism with a truly client-focused approach. With an extensive background in sales and leadership roles at Fortune 500 companies, Tracie brings decades of experience in negotiation, strategic planning, and relationship building to the real estate industry.",
            "Her vision for Culver Realty was to create a niche brokerage that goes beyond traditional transactions by prioritizing the unique needs of each client. Tracie's philosophy is rooted in the belief that real estate is not just about properties — it's about people, trust, and long-term partnerships.",
            "This vision has shaped Culver Realty into a firm known for personalized service, integrity, and outstanding results in both real estate sales and property management.",
        ],
    },
    {
        name: "Alexis Strong",
        role: "Realtor / Senior Property Manager",
        photo: "/api/uploads/seed/team-alexis.jpg",
        bio: [
            "Alexis Strong is a distinguished Realtor and Property Manager with Culver Realty & Property Management, celebrated for her integrity, discretion, and refined client service. With a meticulous eye for detail and a deep understanding of the luxury real estate market, Alexis provides a seamless experience marked by professionalism, precision, and trust.",
            "Her client-first philosophy ensures that every interaction is handled with care, sophistication, and the highest level of personalized attention. Guided by the belief that true success in real estate is built on relationships, Alexis curates tailored strategies that align with each client's vision and goals.",
            "Whether representing exclusive properties or managing premier investments, she blends market expertise with a commitment to excellence — delivering results that exceed expectations and reflect the elevated standards of Culver Realty's distinguished reputation.",
        ],
    },
    {
        name: "Tom Culver",
        role: "Florida Certified Building Contractor CBC / Realtor",
        photo: "/api/uploads/seed/team-tom.jpg",
        bio: [
            "Tom Culver is a Florida Certified Building Contractor and Licensed Realtor with over 25 years of experience in construction, insurance restoration, and property management. His extensive background in building and restoration has given him a deep understanding of structural integrity, maintenance, and long-term property value — skills that translate seamlessly into effective, detail-oriented property management.",
            "Tom takes a hands-on approach to overseeing properties, ensuring they are well-maintained, compliant, and profitable for owners. His unique combination of construction knowledge and real estate insight allows him to anticipate challenges, manage costs efficiently, and deliver exceptional results for clients.",
            "Known for his professionalism, reliability, and commitment to excellence, Tom provides a level of expertise that adds true value to every property he manages or represents.",
        ],
    },
    {
        name: "Jana Tierney",
        role: "Realtor",
        photo: "/api/uploads/seed/team-jana.jpg",
        bio: [
            "Jana Tierney is a trusted real estate professional known for her personalized service, local market expertise, and commitment to helping clients achieve their real estate goals. As part of the Culver Realty & Property Management team, Jana provides comprehensive support to buyers, sellers, and investors — making every step of the process smooth and stress-free.",
            "With a sharp eye for detail and a strong understanding of market trends, Jana guides her clients with integrity, clear communication, and a results-driven approach. Whether you're purchasing your first home, selling a long-time property, or exploring investment opportunities, you can count on Jana to deliver exceptional service and consistent results.",
            "Dedicated, approachable, and always client-focused, Jana Tierney is your go-to resource for real estate done right.",
        ],
    },
    {
        name: "Tyce Moore",
        role: "Realtor",
        photo: "/api/uploads/seed/team-tyce.jpg",
        bio: [
            "Tyce Moore is a dedicated Palm Coast Realtor who brings a strategic yet personable approach to the home buying and home selling process. Tyce is a native of Tifton, Georgia, a proud U.S. Navy Veteran, and a graduate of Troy University with a Bachelor's degree in Political Science.",
            "Drawing from years of experience as an entrepreneur, Tyce has built a reputation for his refreshingly friendly customer care and proven ability to guide buyers to obtain the best value for their dream home, and to assist sellers to a smooth, stress-free sale of their home.",
            "Whether rooting for the Florida State Seminoles or playing in a local golf league, in his free time you can find Tyce watching or talking sports. He's an avid explorer of Palm Coast and its surrounding cities, loves to try new restaurants and check out neighborhood festivals with his wife, Jaclyn, and their beautiful children, Tatum, Jace and Talan.",
        ],
    },
];

export default function Team() {
    return (
        <Page>
            <Seo
                title="Meet the Team | Culver Realty & Property Management, Ormond Beach"
                description="Meet the experienced real estate and property management team at Culver Realty & Property Management in Ormond Beach, FL — serving Volusia and Flagler Counties."
            />
            <section className="bg-navy text-bone py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                    <Reveal>
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-3">Meet the team</p>
                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight font-medium max-w-3xl leading-[1.08]">
                            Introducing the experienced team at Culver Realty
                        </h1>
                        <p className="text-bone/75 mt-6 max-w-2xl leading-relaxed">
                            Our dedicated team of professionals is committed to helping you navigate the complexities
                            of buying, selling, or managing properties with ease. Choose Culver Realty for a
                            personalized approach that ensures your satisfaction and success.
                        </p>
                    </Reveal>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16 md:py-24">
                <div className="space-y-16 md:space-y-24">
                    {TEAM.map((member, i) => (
                        <Reveal key={member.name}>
                            <article
                                className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}
                                data-testid={`team-member-${member.name.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                                <div className="md:col-span-4 [direction:ltr]">
                                    <div className="aspect-[3/4] overflow-hidden bg-sand-200">
                                        <img
                                            src={member.photo}
                                            alt={`Portrait of ${member.name}`}
                                            loading="lazy"
                                            className="w-full h-full object-cover object-top hover:scale-[1.03] transition-transform duration-700 ease-out"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-8 [direction:ltr]">
                                    <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold">{member.role}</p>
                                    <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-navy mt-2">{member.name}</h2>
                                    <div className="w-12 h-[2px] bg-gold mt-5" />
                                    {member.bio.map((para, j) => (
                                        <p key={j} className="text-base text-slate-600 leading-relaxed mt-5">{para}</p>
                                    ))}
                                </div>
                            </article>
                        </Reveal>
                    ))}
                </div>
                <Reveal className="mt-20 bg-navy text-bone p-8 md:p-12 text-center">
                    <h2 className="font-serif text-2xl sm:text-3xl font-medium">Work with a team that puts relationships first</h2>
                    <p className="text-sm text-bone/70 mt-3">Call {BRAND.phone} or email {BRAND.email}</p>
                    <div className="flex flex-wrap justify-center gap-4 mt-7">
                        <a href={BRAND.phoneHref} data-testid="team-call-button" className="inline-flex items-center justify-center px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover transition-all min-h-[44px]">
                            Call {BRAND.phone}
                        </a>
                        <a href="/contact" data-testid="team-contact-button" className="inline-flex items-center justify-center px-7 py-3.5 border border-bone/40 text-bone text-sm font-semibold tracking-wider uppercase hover:bg-bone hover:text-navy transition-all min-h-[44px]">
                            Contact us
                        </a>
                    </div>
                </Reveal>
            </section>
        </Page>
    );
}
