export interface Candidate {
  id: string
  name: string
  current_position: string
  summary: string
  skills: string[]
  experience: string
  education: string
  github_activity: string
  notable_projects: string
  linkedin_url: string
  github_url: string
}

export interface RankedCandidate extends Candidate {
  rank: number
  match_score: number
  signal_breakdown: {
    semantic: number
    career: number
    behavioral: number
  }
  why_ranked: string
}

export const CANDIDATE_POOL: Candidate[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    current_position: 'Senior Software Engineer @ Google',
    summary: 'Full-stack engineer with 6 years building distributed systems at scale. Led migration of monolithic architecture to microservices serving 50M+ users. Deep expertise in Go and Kubernetes. Active open source contributor.',
    skills: ['Go', 'Kubernetes', 'React', 'TypeScript', 'PostgreSQL', 'gRPC', 'Docker', 'GCP'],
    experience: '6 years total. Google L5 (3 years) — led distributed systems migration. Previously at Zomato (2 years) — built real-time order tracking. Razorpay (1 year internship) — payments infrastructure.',
    education: 'B.Tech Computer Science, IIT Bombay, 2018. CGPA 9.2/10.',
    github_activity: '847 contributions last year. 3 repositories with 500+ stars each. Maintains a popular Go HTTP client library with 2.1k stars. Regular contributor to Kubernetes ecosystem.',
    notable_projects: 'ApexRoute: open source traffic routing library for microservices (2.1k GitHub stars). Contributed 12 PRs to kubernetes/kubernetes. Built real-time fraud detection system at Google processing 1M transactions/minute.',
    linkedin_url: 'https://linkedin.com/in/priya-sharma-swe-google',
    github_url: 'https://github.com/priyasharma-dev'
  },
  {
    id: '2',
    name: 'Arjun Mehta',
    current_position: 'Lead Backend Engineer @ Flipkart',
    summary: 'Backend specialist with 7 years building high-throughput systems. Expert in event-driven architecture and Kafka at scale. Led team of 8 engineers. Two promotions in 5 years at Flipkart.',
    skills: ['Java', 'Kafka', 'Spring Boot', 'Redis', 'MongoDB', 'AWS', 'Python', 'Elasticsearch'],
    experience: '7 years total. Flipkart Lead Engineer (5 years, 2 promotions) — owns order management system handling 10M orders/day during Big Billion Days. Previous: Wipro (2 years) — enterprise Java development.',
    education: 'B.E. Information Technology, BITS Pilani, 2017. CGPA 8.7/10.',
    github_activity: '312 contributions last year. Primarily private repos. 1 public project — a Kafka consumer library with 340 stars.',
    notable_projects: 'Redesigned Flipkart order management system reducing p99 latency from 800ms to 45ms. Built internal event streaming platform handling 2B events/day. Open source Kafka consumer toolkit.',
    linkedin_url: 'https://linkedin.com/in/arjun-mehta-backend',
    github_url: 'https://github.com/arjunmehta-eng'
  },
  {
    id: '3',
    name: 'Sneha Patel',
    current_position: 'Software Engineer @ Microsoft',
    summary: 'Frontend-leaning full-stack engineer with 4 years experience. Strong in TypeScript and React. Shipped consumer products to 10M+ users on Azure. Active open source contributor with npm packages at 50k+ weekly downloads.',
    skills: ['TypeScript', 'React', 'Node.js', 'Azure', 'GraphQL', 'Tailwind CSS', 'Next.js', 'Prisma'],
    experience: '4 years total. Microsoft SDE-2 (3 years) — shipping features for Microsoft Teams web client used by 300M users. Previous: startup (1 year) — founding engineer, built product from scratch.',
    education: 'B.Tech Computer Science, NIT Trichy, 2020. CGPA 8.9/10.',
    github_activity: '1,203 contributions last year. 3 npm packages with 50k+ combined weekly downloads. Regular contributor to react-query and tRPC. Highly active on GitHub.',
    notable_projects: 'react-optimistic: npm package for optimistic UI updates (28k weekly downloads). Contributed 8 PRs to tRPC. Built Microsoft Teams file sharing feature shipped to 300M users.',
    linkedin_url: 'https://linkedin.com/in/sneha-patel-microsoft',
    github_url: 'https://github.com/snehapatel-ts'
  },
  {
    id: '4',
    name: 'Rahul Verma',
    current_position: 'Backend Engineer @ Razorpay',
    summary: 'Payments infrastructure engineer with 3 years experience. Expert in high-availability systems and financial data pipelines. Built transaction processing handling ₹10B+ monthly. Strong Java and SQL fundamentals.',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker', 'Terraform', 'AWS', 'Python'],
    experience: '3 years total. Razorpay SDE-2 (3 years) — owns payment gateway core service. No prior full-time experience. Strong internship at Paytm during college.',
    education: 'B.Tech Computer Science, VIT Vellore, 2021. CGPA 8.4/10.',
    github_activity: '87 contributions last year. No significant public repositories. Mostly private work repos.',
    notable_projects: 'Razorpay payment gateway retry logic reducing failed payments by 23%. Built internal transaction reconciliation system. Final year project: blockchain-based voting system.',
    linkedin_url: 'https://linkedin.com/in/rahul-verma-razorpay',
    github_url: ''
  },
  {
    id: '5',
    name: 'Divya Krishnan',
    current_position: 'SDE-2 @ Amazon',
    summary: 'Cloud-native engineer with 3 years at Amazon. Expert in serverless architecture and AWS Lambda. Strong fundamentals but limited distributed systems experience. Fast learner with excellent problem-solving skills.',
    skills: ['Python', 'AWS Lambda', 'DynamoDB', 'CDK', 'TypeScript', 'Step Functions', 'SQS', 'S3'],
    experience: '3 years total. Amazon SDE-2 (3 years) — builds internal tooling for AWS Supply Chain team. No prior experience before Amazon.',
    education: 'B.Tech Computer Science, SRM University, 2021. CGPA 9.1/10.',
    github_activity: '534 contributions last year. Consistent daily activity. 2 public repos — CDK construct libraries with moderate adoption (120 stars combined).',
    notable_projects: 'AWS CDK constructs library for supply chain patterns (open sourced internally). Built Lambda-based ETL pipeline processing 50GB/day. Active technical blogger — 3 AWS blog posts published.',
    linkedin_url: 'https://linkedin.com/in/divya-krishnan-aws',
    github_url: 'https://github.com/divyakrishnan-cloud'
  },
  {
    id: '6',
    name: 'Karan Singh',
    current_position: 'Full Stack Engineer @ Swiggy',
    summary: 'Product-focused full-stack engineer with 5 years at Swiggy. Built features used by 80M+ users. Strong React and Node.js. Recently moved into backend-heavy work on delivery routing algorithms.',
    skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'Redis', 'GCP', 'GraphQL', 'React Native'],
    experience: '5 years total. Swiggy SDE-2 (5 years, 1 promotion) — worked across consumer app, partner app, and backend routing services. Built Swiggy Instamart launch features.',
    education: 'B.Tech Computer Science, DTU Delhi, 2019. CGPA 7.8/10.',
    github_activity: '423 contributions last year. 1 popular React hooks library with 890 stars. Regular open source contributions.',
    notable_projects: 'Built Swiggy Instamart 10-minute delivery tracking UI from scratch. Optimised delivery partner matching algorithm reducing average delivery time by 4 minutes. Open source React hooks library (890 stars).',
    linkedin_url: 'https://linkedin.com/in/karan-singh-swiggy',
    github_url: 'https://github.com/karansingh-fs'
  }
]
