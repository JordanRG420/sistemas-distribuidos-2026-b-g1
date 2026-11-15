# Certification C3 — Jordan Ramirez Gallego

## Cover

| Field | Value |
|---|---|
| Full name | Jordan Ramirez Gallego |
| GitHub user | JordanRG420 |
| Group | G1 |
| Team | Synkro |
| Team -docs repository | https://github.com/code-corhuila/synkro-docs |
| Course | HCCDP-Solution Architectures Course |
| Course link | https://e.huawei.com/en/talent/ict-academy/#/ictcourses-detail?courseId=6WtKiPd1S1YelBB0AUbE1vXlPgk |
| Start date | 2026-11-01 |
| Completion date | 2026-11-15 |

## Study log

| Date | Hours | Chapters or labs | Evidence file |
|---|---|---|---|
| 2026-11-13 | 7.2 | Enrollment and chapters 1 to 11 | evidence/00-enrollment.png, evidence/01-chapter-01.png to evidence/11-chapter-11.png |
| 2026-11-14 | 5.0 | Chapters 12 to 14 | evidence/12-chapter-12.png to evidence/14-chapter-14.png |
| 2026-11-15 | 9.0 | Labs 1 to 4 and final exam | evidence/15-lab-1.png to evidence/18-lab-4.png, evidence/19-final-exam.png |
| Total | 21.2 | | |

## Labs

| Evidence file | Lab name | What I built | What failed first and how I fixed it |
|---|---|---|---|
| evidence/15-lab-1.png | Design Cases and Practices of an O&M Solution | I created the subnet-db subnet and an RDS instance for the Discuz! application on the preset VPC and ECS. | The application could not reach the database at first, so I checked the security group rule and allowed the database port from the web subnet. |
| evidence/16-lab-2.png | High-Performance Network Solution | I worked on a Huawei Cloud network setup with the preset VPC, subnet, security group and ECS in the sandbox account. | The console showed insufficient permissions at first, so I logged in again as the IAM sandbox user with the lab credentials. |
| evidence/17-lab-3.png | Highly Elastic Service System | I configured an elastic service on the lab ECS desktop using Huawei Cloud scaling and load balancing services. | The preset resources were not ready when I started, so I waited for the preset to finish and reopened the exercise page. |
| evidence/18-lab-4.png | Highly Reliable Database Solution | I practiced the database services of Huawei Cloud, setting up a database with high availability. | The first login used the wrong account type, so I switched to the IAM user login and used the sandbox credentials. |

## Final exam

- Score: 81
- Date: 2026-11-15
- Evidence: [evidence/19-final-exam.png](evidence/19-final-exam.png)

## Skills summary

I learned to design for the five principles of reliability, security, performance, cost and operations on Huawei Cloud.
I applied multi-AZ deployment with ELB health checks and RDS primary and standby databases to remove single points of failure.
I used Auto Scaling policies driven by Cloud Eye metrics, with minimum and maximum instance limits to control cost.
I compared DR patterns by RTO and RPO and chose on-cloud active-active for a zero RPO.
I wrote infrastructure as code with RFS and Terraform templates so deployments are repeatable.
I redesigned the Synkro microservices for CCE containers, a gateway, a persisted saga and a CI/CD pipeline.