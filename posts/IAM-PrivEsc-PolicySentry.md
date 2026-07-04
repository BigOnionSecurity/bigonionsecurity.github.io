# AWS Cloud Pentesting: IAM Privilege Escalation via a User Group

During a recent AWS cloud pentest, I found a privilege escalation vulnerability that would allow an ordinary cloud user to escalate their privileges to anything they wanted, including obtaining administrative access. This would usually be considered a **High severity** finding according to [CVSS 4.0](https://www.first.org/cvss/calculator/4.0#CVSS:4.0/AV:A/AC:L/AT:P/PR:L/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H). I wanted to turn this finding into an informative blog post because it highlights how easily IAM permissions can be misconfigured and what can be done about it.

## Background

For context, this was a normal cloud user account without any special roles. They were not in the administrator's group and their attached user policy looked secure. However, this user was in a **"GenAI" group**, and the permissions of *this* group were much more interesting.

## The Vulnerability

Attached to the "GenAI" group were official AWS managed policies allowing full access for IAM, EC2, Bedrock, and Step Functions:

- `arn:aws:iam::aws:policy/AmazonEC2FullAccess`
- `arn:aws:iam::aws:policy/IAMFullAccess`
- `arn:aws:iam::aws:policy/AmazonBedrockFullAccess`
- `arn:aws:iam::aws:policy/AWSStepFunctionsFullAccess`

Managed policies are official AWS policies and can be used as an easy way to assign all permissions of a particular service to a user, group, or role. Unfortunately, managed policies are often used when a user, group, or role needs *some* privileges, but either:

1. it's not clear what privileges are exactly needed,
2. there's a lack of knowledge of IAM privileges, or
3. laziness — managed policies are the path of least resistance.

Usually it's some combination of all three. So what was the cause in this instance? Only the client knows, but it's irrelevant. The point is that a group in the AWS account had the `IAMFullAccess` policy, which includes every single IAM permission. Additionally, AWS permissions are cumulative and are applied to users that are in specific groups. The AWS documentation clearly states:

> "For example, you could have a user group called Admins and give that user group typical administrator permissions. Any user in that user group automatically has Admins group permissions."

In this scenario, the ordinary user is in a "GenAI" group that has the `IAMFullAccess` policy attached to it. This means that user can execute **any** single IAM command they want. Now, how can privileges be escalated with this?

## Escalation Paths

Since the user can execute any IAM command, it is as simple as attaching an administrator policy to the user. A full list of possible privilege escalations and examples can be found at the [AWS Cloud HackTricks](https://cloud.hacktricks.wiki/en/pentesting-cloud/aws-security/aws-privilege-escalation/aws-iam-privesc/index.html) page, but some of the more common ones are listed below.

**`iam:CreatePolicyVersion`**
```bash
aws iam create-policy-version --policy-arn <target_policy_arn> \
    --policy-document file:///path/to/administrator/policy.json --set-as-default
```

**`iam:CreateAccessKey`**
```bash
aws iam create-access-key --user-name <target_user>
```

**`iam:AttachUserPolicy`**
```bash
aws iam attach-user-policy --user-name <username> --policy-arn "<policy_arn>"
```

**`iam:AttachGroupPolicy`**
```bash
aws iam attach-group-policy --group-name <group_name> --policy-arn "<policy_arn>"
```

**`iam:AttachRolePolicy`**
```bash
aws iam attach-role-policy --role-name <role_name> --policy-arn "<policy_arn>"
```

**`iam:AddUserToGroup`**
```bash
aws iam add-user-to-group --group-name <group_name> --user-name <username>
```

Now, back to our scenario. If the user's account was compromised for any reason, the attacker would be able to use one of the commands above to pivot in the environment.

## How to Defend

Looking at our escalation path, the crux of the issue is that the user is attached to a group that is wildly over-permissioned. So to disarm this escalation path, group permissions need to be reviewed. Using groups to help manage IAM permissions is encouraged, but adding AWS managed policies to groups is a bad way to do it. Now, there *might* be a legitimate need for this setup and the client will have to accept or mitigate the risk, but having multiple managed policies for different services screams that the cause is a lack of knowledge and/or laziness.

So how do we help clients overcome this lack of knowledge or laziness? By introducing them to **Policy Sentry**.

Policy Sentry is an open source tool created by Salesforce to help developers and non-AWS folks create custom IAM policies using the concept of least privilege. This tool abstracts the granularity of IAM permissions. For example, the developer knows that the group will need READ access to S3 buckets and WRITE access to create IAM users, but might not know what the exact IAM permissions are for that. Policy Sentry allows them to specify their access on resources and will generate an IAM policy accordingly.

Additionally, developers can query the database of actions to see what permissions they should use depending on the service and access level.

- **Tool:** [github.com/salesforce/policy_sentry](https://github.com/salesforce/policy_sentry/)
- **Documentation:** [policy-sentry.readthedocs.io](https://policy-sentry.readthedocs.io/en/latest/)
